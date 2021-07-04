import React, { useState } from 'react';
import './BodyQuestionComponent.scss';

// Searches for "(blah|foo)" dropdown representative strings
const DROPDOWN_REGEXP = /(\(.+?\|.*?\))/g;

const parseDropdownString = (dropdownString: string) => 
    dropdownString.substr(1, dropdownString.length - 2).split('|')

const countDropdowns = (splitSentence: Array<string>) => 
    splitSentence.filter(subSentence => subSentence.match(DROPDOWN_REGEXP)).length;

type BodyQuestionComponentProps = {
    onSubmit: (indices: Array<number>) => void, 
    question: string
}

function shuffleArray(array: Array<any>) {
    if (Math.random() === 0) {
        return array; // tests
    }
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export default ({ onSubmit, question }: BodyQuestionComponentProps) => {
    const [selectedDropdownIndices, setSelectedDropdownIndices] = useState<Array<number>>(
        (question.match(DROPDOWN_REGEXP) || []).map(question => Math.floor(Math.random() * question.split('|').length))
    );
    const [isAnswered, setIsAnswered] = useState<boolean>(false)

    // Each item is either an arbitrary string or a "dropdown" string like "(blah|foo)"
    const splitQuestion = question.split(DROPDOWN_REGEXP) || [];

    const dropdownClassName = (dropdownIdx: number): string => {
        if (isAnswered) {
            if (selectedDropdownIndices[dropdownIdx] == 0) {
                return 'success';
            } else {
                return 'error';
            }
        }
        return '';
    }

    return (
        <div className="BodyQuestionComponent">
            <div>
                {splitQuestion.map((subSentence, subSentenceIdx) => {
                    if (DROPDOWN_REGEXP.test(subSentence)) {
                        const options = parseDropdownString(subSentence);
                        const dropdownIdx = countDropdowns(splitQuestion.slice(0, subSentenceIdx));
                        return [
                            <span key={subSentenceIdx}>
                                <select
                                    className={dropdownClassName(dropdownIdx)}
                                    disabled={isAnswered}
                                    value={selectedDropdownIndices[dropdownIdx]}
                                    onChange={e => {
                                        const newIndices = [...selectedDropdownIndices];
                                        newIndices[dropdownIdx] = parseInt(e.target.value);
                                        setSelectedDropdownIndices(newIndices);
                                    }}
                                >
                                {shuffleArray(options.map((option, idx) => (
                                    <option key={idx} value={idx}>
                                        {option}
                                    </option>
                                )))}
                                </select>
                            </span>,
                            isAnswered ? <sup key={`index${subSentenceIdx}`} className={dropdownClassName(dropdownIdx)}>({dropdownIdx + 1})</sup> : null
                        ];
                    } else {
                        return <span key={subSentenceIdx}>{subSentence}</span>;
                    }
                })}
            </div>
            {isAnswered 
                ? null 
                :  <button className="button" onClick={() => {
                        setIsAnswered(true);
            
                        onSubmit(selectedDropdownIndices);
                    }}>Submit</button>
            }
        </div>
    );
};
