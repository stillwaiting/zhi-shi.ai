import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Browser from './browser/Browser';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Route, Switch, Link, useHistory } from "react-router-dom";

import ChoiceComponent from './ChoiceComponent';

declare global {
  interface Window { 
    vscode: any | undefined; 
  }
}


if (window.vscode) {
  ReactDOM.render(
    <React.StrictMode>
      <Router>
        <Switch>
            <Route >
              <Browser />
            </Route>
          </Switch>
      </Router>
    </React.StrictMode>,
    document.getElementById('root')
  );
} else {
  ReactDOM.render(
    <React.StrictMode>
      <Router>
        <Switch>
            <Route >
              <ChoiceComponent />
            </Route>
          </Switch>
      </Router>
    </React.StrictMode>,
    document.getElementById('root')
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
