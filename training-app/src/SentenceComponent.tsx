import React, { useState, useEffect } from 'react';
import './SentenceComponent.css';

// Searches for "(blah|foo)" dropdown strings
const DROPDOWN_REGEXP = /(\(.+?\|.*?\))/g;

const parseDropdownString = (dropdownString: string) => 
    dropdownString.substr(1, dropdownString.length - 2).split('|')

const countDropdowns = (splitSentence: Array<string>) => 
    splitSentence.filter(subSentence => subSentence.match(DROPDOWN_REGEXP)).length;

type SentenceComponentProps = {
    onSubmit: (indices: Array<number>) => void, 
    sentence: string
}

export default ({ onSubmit, sentence }: SentenceComponentProps) => {
    const [selectedDropdownIndices, setSelectedDropdownIndices] = useState<Array<number>>(
        Array((sentence.match(DROPDOWN_REGEXP) || []).length).fill(0)
    );

    // Each item is either an arbitrary string or a "dropdown" string "(blah|foo)"
    const splitSentence = sentence.split(DROPDOWN_REGEXP) || [];

    return (
        <div className="SentenceComponent">
            <div>
                {splitSentence.map((subSentence, subSentenceIdx) => {
                    if (DROPDOWN_REGEXP.test(subSentence)) {
                        const options = parseDropdownString(subSentence);
                        return (
                            <span key={subSentenceIdx}>
                                <select
                                    className="select"
                                    onChange={e => {
                                        const newIndices = [...selectedDropdownIndices];
                                        newIndices[countDropdowns(splitSentence.slice(0, subSentenceIdx))] = parseInt(e.target.value);
                                        setSelectedDropdownIndices(newIndices);
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
                    } else {
                        return <span key={subSentenceIdx}>{subSentence}</span>;
                    }
                })}
            </div>
            <button className="button" onClick={() => onSubmit(selectedDropdownIndices)}>
                Submit
            </button>
        </div>
    );
};
