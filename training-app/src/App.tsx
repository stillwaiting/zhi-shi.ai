import React from 'react';
import logo from './logo.svg';
import './App.css';
import SentenceComponent from './SentenceComponent'

function App() {
  return (
    <div className="App">
      <SentenceComponent sentence="Hello, world!" onSubmit={() => {}} />
    </div>
  );
}

export default App;
