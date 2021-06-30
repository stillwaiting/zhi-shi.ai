import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Route, Switch, Link, useHistory } from "react-router-dom";

let lastHash = '#';
setInterval(() => {
  if (window.location.hash != lastHash) {
    lastHash = window.location.hash;
    const anchor = lastHash.substr(1);
    const higlightAreas = document.getElementsByClassName('highlight');
    for (let areaIdx = 0; areaIdx < higlightAreas.length; areaIdx++) {
      const area = higlightAreas[areaIdx];
      area.classList.remove('active');
      if (area.classList.contains('highlight-' + anchor)) {
        area.classList.add('active');
      }
    }
  }
}, 100);

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
          <Route >
            <App />
          </Route>
        </Switch>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
