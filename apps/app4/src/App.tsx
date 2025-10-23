import React from 'react';
import logo from './logo.svg';
import './App.css';
import { hello, deepHello } from '@grxxxx/my-lib';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p>
          <strong>From my-lib:</strong> {hello()}
        </p>
        <p>
          <strong>Deep Hello:</strong> {deepHello()}
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;