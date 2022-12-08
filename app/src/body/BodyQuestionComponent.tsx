import React, { useRef, useState } from 'react';
import './BodyQuestionComponent.scss';
import BodyTextParagraphComponent from './BodyTextParagraphComponent';
import _ from 'lodash';

// Searches for "(blah|foo)" dropdown representative strings
const DROPDOWN_REGEXP = /(\(.+?\|.*?\))/g;

const parseDropdownString = (dropdownString: string): Array<string> => 
    dropdownString.substr(1, dropdownString.length - 2).split('|')

const countDropdowns = (splitSentence: Array<string>) => 
    splitSentence.filter(subSentence => subSentence.match(DROPDOWN_REGEXP)).length;

type BodyQuestionComponentProps = {
    onSubmit: (indices: Array<number>) => void, 
    question: string,
    answeredIndices: Array<number>,
    submitLabel: string,
    correctLabel: string
}

function shuffleArray(origArray: Array<string>) {
    const array = _.cloneDeep(origArray);
    if (Math.random() === 0) {
        return array; // tests
    }
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export default ({ onSubmit, question, answeredIndices, submitLabel, correctLabel }: BodyQuestionComponentProps) => {
    const [selectedDropdownIndices, setSelectedDropdownIndices] = useState<Array<number>>(
        answeredIndices.length > 0 
            ? answeredIndices : 
            (question.match(DROPDOWN_REGEXP) || []).map(question => -1)
    );

    const firstDropdownRef = useRef<HTMLSelectElement | null>(null);
    
    // Each item is either an arbitrary string or a "dropdown" string like "(blah|foo)"
    const splitQuestion = question.split(DROPDOWN_REGEXP) || [];

    const dropdownClassName = (dropdownIdx: number): string => {
        if (answeredIndices.length > 0) {
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
                                    ref={subSentenceIdx == 1 ? firstDropdownRef : null}
                                    autoFocus={subSentenceIdx == 1}
                                    className={dropdownClassName(dropdownIdx)}
                                    disabled={answeredIndices.length > 0}
                                    value={selectedDropdownIndices[dropdownIdx]}
                                    onChange={e => {
                                        const newIndices = [...selectedDropdownIndices];
                                        newIndices[dropdownIdx] = parseInt(e.target.value);
                                        setSelectedDropdownIndices(newIndices);
                                    }}
                                >
                                    <option key="-1" value="-1">{answeredIndices.length > 0 ? options[0] : '?'}</option>
                                {shuffleArray(options).map((option, idx) => (
                                    // not super efficient, but the list is small, no need to optimize now
                                    <option key={idx} value={options.indexOf(option)}>
                                        {option}
                                    </option>
                                ))}
                                </select>
                            </span>,
                            answeredIndices.length > 0 ? <sup key={`index${subSentenceIdx}`} className={dropdownClassName(dropdownIdx)}>({dropdownIdx + 1})</sup> : null,
                            answeredIndices.length > 0 && selectedDropdownIndices[dropdownIdx] > 0 && options.length > 0
                                    ? <span className='hint'>&nbsp; ({correctLabel}: "{options[0]}")</span>
                                    : null,
                        ];
                    } else {
                        return <BodyTextParagraphComponent key={subSentenceIdx} data={{text: subSentence}} inline={true} />;
                    }
                })}
                <sup style={{visibility:'hidden'}}>A{/*adjust height to prevent jumps when answer is revealed*/}</sup>
            </div>
            {answeredIndices.length > 0 
                ? null 
                :  <button className="button" onClick={() => {
                        onSubmit(selectedDropdownIndices);
                    }}
                    onKeyDown={
                        (e) => {
                            if (e.key == 'ArrowDown' || e.key == 'ArrowUp') {
                                console.log('here', firstDropdownRef.current);
                                firstDropdownRef.current?.focus();
                            }
                        }
                    }
                    >{submitLabel || 'Submit'}</button>
            }
        </div>
    );
};
