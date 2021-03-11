import React, { useState, useEffect } from 'react';
import './SentenceComponent.css';

type SentenceComponentProps = {
    onSubmit: (indices: Array<number>) => void, 
    sentence: string
}

const Component = ({ onSubmit, sentence }: SentenceComponentProps) => {
  const [indices, setIndices] = useState<Array<number>>([]);
  const [sanitizedSentence, setSanitizedSentence] = useState<Array<string>>([]);
  const [dropdowns, setDropdowns] = useState<Array<string>>([]);

  useEffect(() => {
    if (sentence) {
      setDropdowns(sentence.match(/(\(.+?\|.*?\))/g) || []);
      setSanitizedSentence(sentence.split(/(\(.+?\|.*?\))/g) || []);
      setIndices(Array((sentence.match(/(\(.+?\|.*?\))/g) || []).length).fill(0));
    }
  }, [sentence]);

  return (
    <div className="SentenceComponent">
      <div>
        {sanitizedSentence.map((subSentence, index) => {
          if (/(\(.+?\|.*?\))$/.test(subSentence)) {
            const options = subSentence
              .replace(/(\()/g, '')
              .replace(/(\))/g, '')
              .split('|');
            return (
              <span key={index}>
                <select
                  className="select"
                  onChange={e => {
                    const newIndices = [...indices];
                    newIndices[dropdowns.indexOf(subSentence)] = Number(
                      e.currentTarget.value
                    );
                    setIndices(newIndices);
                  }}
                >
                  {options.map((option, idx) => {
                    if (option)
                      return (
                        <option key={idx} value={idx}>
                          {option}
                        </option>
                      );
                  })}
                </select>
              </span>
            );
          } else return <span key={index}>{subSentence}</span>;
        })}
      </div>
      <button className="button" onClick={() => onSubmit(indices)}>
        Submit
      </button>
    </div>
  );
};

export default Component;