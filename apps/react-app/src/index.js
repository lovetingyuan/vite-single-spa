import { appName } from  './publicPath';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import singleSpaReact from 'single-spa-react';

if (window.singleApp) {
  // Note that SingleSpaContext is a react@16.3 (if available) context that provides the singleSpa props

  const reactLifecycles = singleSpaReact({
    React,
    ReactDOM,
    rootComponent: () => (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    ),
    errorBoundary(err, info, props) {
      // https://reactjs.org/docs/error-boundaries.html
      return (
        <div>This renders when a catastrophic error occurs</div>
      );
    },
    domElementGetter() {
      return document.getElementById(appName)
    }
  });
  window.singleApp.startApp(appName, reactLifecycles)
} else {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
}
