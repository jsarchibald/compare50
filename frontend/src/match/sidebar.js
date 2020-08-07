import React, {useRef, useEffect} from 'react';
import ReactTooltip from 'react-tooltip';

import Graph from '../home/graph';
import API from '../api';
import render50 from "./code/render50";

import './matchview.css';
import './sidebar.css';


function SideBar(props) {
    let style = {
        "margin": "auto",
        "marginBottom": ".5em",
        "marginTop": ".5em",
        "width": "90%"
    }

    const updateGlobalState = newState => props.setGlobalState({...props.globalState, ...newState})

    return (
        <React.Fragment>
            <ReactTooltip place="right" type="dark" effect="solid" id="sidebar-tooltip"/>
            <div className="column-box">
                <div className="row auto" style={style}>
                    <MatchNavigation
                        current={props.globalState.currentMatch}
                        n={props.globalState.nMatches}
                        setMatch={match => updateGlobalState({"currentMatch": match})}
                    />
                </div>
                <div className="row auto" style={style}>
                    <PassNavigation
                        passes={props.globalState.passes}
                        currentPass={props.globalState.currentPass}
                        setPass={pass => updateGlobalState({"currentPass": pass})}
                    />
                </div>
                <div className="row auto" style={style}>
                    <GroupNavigation
                        spanManager={props.spanManager}
                        setGroup={group => updateGlobalState({"currentGroup": group})}
                    />
                </div>
                <div className="row auto" style={style}>
                    <ConfigMenu
                        softWrap={props.globalState.softWrap}
                        setSoftWrap={softWrap => updateGlobalState({"softWrap": softWrap})}
                        hideIgnored={props.globalState.hideIgnored}
                        setHideIgnored={hideIgnored => updateGlobalState({"hideIgnored": hideIgnored})}
                        showWhiteSpace={props.globalState.showWhiteSpace}
                        setShowWhiteSpace={showWhiteSpace => updateGlobalState({"showWhiteSpace": showWhiteSpace})}
                    />
                </div>
                <div className="row auto" style={style}>
                    <ExportMenu/>
                </div>
                <div className="row fill" style={style}>
                    <Graph graph={props.graphData} slider={false} sliderTip={false}/>
                </div>
                <div className="row auto" style={style}>
                    <span
                        className="tooltip-marker"
                        data-tip="This graph shows any known links from the submissions in the match to archives."
                        data-for="sidebar-tooltip"
                    >
                        ?
                    </span>
                </div>
            </div>
        </React.Fragment>
    )
}


function MatchNavigation(props) {
    return (
        <div>
            <div className="monospace-text" style={{
                "textAlign": "center",
                "paddingBottom": ".1em",
                "paddingTop": ".5em",
                "color": "black"
            }}>
                {formatFraction(props.current, props.n)}
            </div>
            <div className="btn-group horizontal" data-tip="Go to the previous and next match" data-for="sidebar-tooltip">
                <span className="btn">
                    <button type="button" style={{"width":"50%"}}>{"<<"}</button>
                </span>
                <span className="btn">
                    <button type="button" style={{"width":"50%"}}>{">>"}</button>
                </span>
            </div>
        </div>
    )
}


function PassNavigation(props) {
    return (
        <div className="btn-group vertical">
            {props.passes.map((pass, i) =>
                <PassButton
                    pass={pass}
                    index={i + 1}
                    isSelected={props.currentPass.name === pass.name}
                    key={`pass_${pass.name}`}
                    setPass={props.setPass}
                />
            )}
        </div>
    )
}


function PassButton(props) {
    useEffect(() => {
        const eventListener = (event) =>  {
            if (event.key === props.index.toString()) {
                event.preventDefault();
                props.setPass(props.pass);
            }
        };

        document.addEventListener("keyup", eventListener);

        return () => document.removeEventListener("keyup", eventListener);
    });

    return (
        <span className="btn" data-tip={`Press ${props.index}`} data-for="sidebar-tooltip">
            <button
                className={`monospace-text ${props.isSelected ? " active" : ""}`}
                type="button"
                title={props.pass.docs}
                style={{"width":"100%"}}
                onClick={() => {props.setPass(props.pass)}}
            >
                {props.pass.name}
            </button>
        </span>
    )
}



function GroupNavigation(props) {
    const prevRef = useRef(null);
    const nextRef = useRef(null);

    useEffect(() => {
        const eventListener = (event) =>  {
            if (event.key.toLowerCase() === "e") {
                event.preventDefault();
                nextRef.current.click();
            }
            else if (event.key.toLowerCase() === "q") {
                event.preventDefault();
                prevRef.current.click();
            }
        };

        document.addEventListener("keyup", eventListener);

        return () => document.removeEventListener("keyup", eventListener);
    }, []);

    return (
        <div>
            <div className="monospace-text" style={{
                "textAlign": "center",
                "paddingBottom": ".1em",
                "color": "black"
            }}>
                {formatFraction(props.spanManager.selectedGroupId(), props.spanManager.nGroups())}
            </div>
            <div className="btn-group horizontal" style={{"width":"100%"}} data-tip={`Press Q E`} data-for="sidebar-tooltip" data-place="bottom">
                <span className="btn">
                    <button
                        className="btn"
                        ref={prevRef}
                        type="button"
                        style={{"width":"50%"}}
                        onClick={() => props.spanManager.selectPreviousGroup()}
                    >
                        &lt;
                    </button>
                </span>
                <span className="btn">
                    <button
                        className="btn"
                        ref={nextRef}
                        type="button"
                        style={{"width":"50%"}}
                        onClick={() => props.spanManager.selectNextGroup()}
                    >
                        &gt;
                    </button>
                </span>
            </div>
        </div>
    )
}


class ExportMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {bg: "", text: "PDF"};
    }

    exportPDF = () => {
        this.setState({bg: "#2196F3", text: "Exporting..."});
        const match = API.getMatch();

        // Reduce all files to one file
        let sub_a = match.filesA().reduce((prev, next) => prev + '/** ' + next.name + " **/\n\n" + next.content + "\n\n\n", "");
        let sub_b = match.filesB().reduce((prev, next) => prev + '/** ' + next.name + " **/\n\n" + next.content + "\n\n\n", "");

        // Come up with a file extension to enable syntax highlighting
        // (will only enable syntax highlighting if all the same language)
        function ext(files) {
            let e = null;
            for (let i = 0; i < files.length; i++) {
                if (e === null) e = files[i].language;
                if (e !== files[i].language) return "";
            }
            return "." + e.toLowerCase();
        }

        let pr = new Promise((resolve) => {
            render50(sub_a, sub_b, "submission_1" + ext(match.filesA()), "submission_2" + ext(match.filesB()), resolve);
        }).then(() => {
            this.setState({bg: "", text: "PDF"});
        });
    }

    render() {
        return (
        <div className="btn-group vertical" data-tip="Export both submissions side-by-side as PDF" data-for="sidebar-tooltip">
            <span className="btn">
                <button type="button" style={{"width":"100%", "backgroundColor": this.state.bg}} onClick={this.exportPDF}>{this.state.text}</button>
            </span>
        </div>
        )
    }
}


function ConfigMenu(props) {
    return (
        <React.Fragment>
            <div style={{"marginBottom": ".25em"}}>
                <Switch text="wrap" default={props.softWrap} setOption={props.setSoftWrap} tooltip="Soft Wrap long lines of code"/>
            </div>
            <div style={{"marginBottom": ".25em"}}>
                <Switch text="hide" default={props.hideIgnored} setOption={props.setHideIgnored} tooltip="Hide code that was not used in the comparison"/>
            </div>
            <div>
                <Switch text="&nbsp;WS&nbsp;" default={props.showWhiteSpace} setOption={props.setShowWhiteSpace} tooltip="Show leading whitespace"/>
            </div>
        </React.Fragment>
    )
}


function Switch(props) {
    // https://stackoverflow.com/questions/2939914/how-do-i-vertically-align-text-in-a-div
    return (
        <div style={{"display": "table", "margin": "auto"}}>
            <label className="switch" style={{"float":"left"}}>
                <input type="checkbox" onChange={event => props.setOption(event.target.checked)} defaultChecked={props.default}/>
                <span className="slider round"></span>
            </label>
            <div style={{"display": "table-cell", "verticalAlign": "middle", "paddingLeft": ".5em"}} data-tip={props.tooltip} data-for="sidebar-tooltip">
                <span className="monospace-text">{props.text}</span>
            </div>
        </div>
    )
}


function formatFraction(numerator, denominator) {
    let nDigits = Math.max(numerator.toString().length, denominator.toString().length);
    const format = n => ("0".repeat(nDigits) + n).slice(-nDigits);
    return `${format(numerator)}/${format(denominator)}`;
}


export default SideBar;
