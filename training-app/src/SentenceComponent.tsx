import React, { useState } from 'react';
import './SentenceComponent.scss';

// Searches for "(blah|foo)" dropdown representative strings
const DROPDOWN_REGEXP = /(\(.+?\|.*?\))/g;

const parseDropdownString = (dropdownString: string) => 
    dropdownString.substr(1, dropdownString.length - 2).split('|')

const countDropdowns = (splitSentence: Array<string>) => 
    splitSentence.filter(subSentence => subSentence.match(DROPDOWN_REGEXP)).length;

type SentenceComponentProps = {
    onSubmit: (indices: Array<number>) => void, 
    isAnswerMode: boolean,
    sentence: string
}

export default ({ onSubmit, sentence, isAnswerMode }: SentenceComponentProps) => {
    const [selectedDropdownIndices, setSelectedDropdownIndices] = useState<Array<number>>(
        Array((sentence.match(DROPDOWN_REGEXP) || []).length).fill(0)
    );

    // Each item is either an arbitrary string or a "dropdown" string like "(blah|foo)"
    const splitSentence = sentence.split(DROPDOWN_REGEXP) || [];

    const dropdownClassName = (dropdownIdx: number): string => {
        if (isAnswerMode) {
            if (selectedDropdownIndices[dropdownIdx] == 0) {
                return 'success';
            } else {
                return 'error';
            }
        }
        return '';
    }

    return (
        <div className="SentenceComponent">
            <div>
                {splitSentence.map((subSentence, subSentenceIdx) => {
                    if (DROPDOWN_REGEXP.test(subSentence)) {
                        const options = parseDropdownString(subSentence);
                        const dropdownIdx = countDropdowns(splitSentence.slice(0, subSentenceIdx));
                        return [
                            isAnswerMode ? <span key={`index${subSentenceIdx}`}>({dropdownIdx + 1})</span> : null,
                            <span key={subSentenceIdx}>
                                <select
                                    className={dropdownClassName(dropdownIdx)}
                                    disabled={isAnswerMode}
                                    onChange={e => {
                                        const newIndices = [...selectedDropdownIndices];
                                        newIndices[dropdownIdx] = parseInt(e.target.value);
                                        setSelectedDropdownIndices(newIndices);
                                    }}
                                >
                                {options.map((option, idx) => (
                                    <option key={idx} value={idx}>
                                        {option}
                                    </option>
                                ))}
                                </select>
                            </span>
                        ];
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
