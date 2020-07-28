import React, {useState, useRef, useEffect} from 'react';
import Split from 'react-split';

import File from './file'

import '../matchview.css';
import './split.css';


function SplitView(props) {
    return (
        <Split
            sizes={[50, 50]}
            gutterSize={10}
            gutterAlign="center"
            snapOffset={30}
            dragInterval={1}
            direction="horizontal"
            cursor="col-resize"
            style={{
                "height":"100%"
            }}
        >
            {[props.match.filesA(), props.match.filesB()].map((files, i) =>
                <div key={`side_${i}`} style={{"height":"100%", "margin":0, "float":"left"}}>
                    <Side
                        height={props.topHeight}
                        files={files}
                        spanManager={props.spanManager}
                        globalState={props.globalState}
                    />
                </div>
            )}
        </Split>
    )
}


function Side(props) {
    let [fileInView, updateFileVisibility] = useMax(props.files.map(file => file.name));

    return (
        <div className="column-box">
            <div className="row auto" style={{
                "height":props.height,
                "lineHeight":props.height
            }}>
                <StatusBar
                    filepath="looooooooooooooooooooooooooooooooooooooooooooong/file/path/to/submission_a"
                    percentage={70}
                    file={fileInView}/>
            </div>
            <div className="row fill" style={{"overflow":"scroll"}}>
                <div style={{"paddingLeft":".5em"}}>
                    {props.files.map(file =>
                        <File
                            key={file.name}
                            file={file}
                            spanManager={props.spanManager}
                            softWrap={props.globalState.softWrap}
                            updateFileVisibility={updateFileVisibility}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}


function StatusBar(props) {
    const filepathRef = useRef(null);

    useEffect(() => {
        filepathRef.current.scrollLeft = filepathRef.current.scrollWidth;
    });

    return (
        <div className="row-box" style={{"fontWeight":"bold"}}>
            <div ref={filepathRef} className="row fill" style={{
                "overflow":"scroll",
                "marginLeft":"5px",
                "marginRight":"5px"
            }}>
                {props.filepath}
            </div>
            <div className="row auto" style={{
                "width":"4em",
                "textAlign":"center"
            }}>
                {`${props.percentage}%`}
            </div>
            <div className="row auto" style={{
                "width":"10em",
                "textAlign":"center"
            }}>
                {props.file}
            </div>
        </div>
    )
}


function useMax(items, initial=null) {
    if (initial === null) {
        initial = items[0];
    }

    const [item, setItem] = useState(initial);

    const values = useRef(items.reduce((acc, item) => {
        acc[item] = 0;
        return acc;
    }, {}));

    // Callback for when the value of an item changes
    const update = (item, value) => {
        values.current[item] = value;

        // Find the item with the highest value
        let maxItem = item;
        let maxValue = 0;
        Object.entries(values.current).forEach(([item, value]) => {
            if (value > maxValue) {
                maxItem = item;
                maxValue = value;
            }
        });

        // If the item with the highest value is different from the last, update maxItem
        if (item !== maxItem) {
            setItem(maxItem);
        }
    }

    return [item, update];
}


export default SplitView
