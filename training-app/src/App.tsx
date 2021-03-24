import React from 'react';
import logo from './logo.svg';
import './App.css';
import SentenceComponent from './SentenceComponent'
import QuestionAnswerComponent from './QuestionAnswerComponent';

function App() {
  return (
    <div className="App">
      <QuestionAnswerComponent 
          sentence="Я (хотел бы|хотел-бы|хотелбы), (чтобы|что бы) мне подарили котенка." 
          answers={["hello there", "world forever"]}
       />
    </div>
  );
}

export default App;
