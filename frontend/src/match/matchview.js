import React, {useState} from 'react';

import './matchview.css';
import SideBar from './sidebar';
import Logo from './logo';
import SplitView from './code/splitview';

import API from '../api';
import useSpanManager from './spanmanager';


function MatchView() {
    const [globalState, setGlobalState] = useState({
        "currentPass": API.getPasses()[0],
        "passes": API.getPasses(),
        "nMatches": 50,
        "currentMatch": 1,
        "currentGroup": 1,
        "nGroups": 6,
        "softWrap": true
    });

    const [match] = useState(API.getMatch());

    const [spanManager] = useSpanManager(API.getMatch().getPass("structure"));

    return (
        <div className="row-box" style={{"height":"100vh"}}>
          <div className="row auto" style={{"width":"9em"}}>
              <div className="column-box" style={{"borderRight": "1px solid #a7adba"}}>
                  <div className="row auto">
                      <Logo height="2.5em"/>
                  </div>
                  <div className="row fill">
                      <SideBar globalState={globalState} setGlobalState={setGlobalState}/>
                  </div>
              </div>
          </div>
          <div className="row fill">
              <SplitView topHeight="2.5em" globalState={globalState} match={match} spanManager={spanManager}/>
          </div>
        </div>
    );
}


export default MatchView;