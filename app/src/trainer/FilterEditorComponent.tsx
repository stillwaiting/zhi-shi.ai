import React from 'react';

import { TopicType } from './TaskSuggester';

export type TopicSelectorComponentProps = {
    topics: Array<TopicType>,
    selectedRuleIdxs: Array<number>,
    onChanged: (newRuleIdxs: Array<number>) => void,
    onClose: () => void
}

function findTopic(topics: TopicType[], currentlySelectedRuleIdx: number[]): TopicType | undefined {
    if (currentlySelectedRuleIdx.length == 0) {
        return undefined;
    }
    return topics.find(topic => !!topic.rules.find(rule => rule.ruleIdx == currentlySelectedRuleIdx[0]))!;
}

export default function({ topics,  selectedRuleIdxs, onChanged, onClose }: TopicSelectorComponentProps ) {
    const selectedTopic = findTopic(topics, selectedRuleIdxs);
    return <div className='TopicSelectorComponent'>
            <select value={(selectedTopic == undefined ? -1 : selectedTopic.topicIdx)} onChange={(e) => {
                if (e.target.value == "-1") {
                    onChanged([]);
                } else {
                    onChanged(topics[parseInt(e.target.value)].rules.map(rule => rule.ruleIdx));
                }

            }}>
                <option value={-1}>All</option>
                {topics.map(topic => 
                    <option key={topic.topicIdx} value={topic.topicIdx}>{topic.title}</option>
                )}
            </select>

            <a href='#' onClick={
                (e) => {
                    e.preventDefault();
                    onClose();
                }
            }>[close]</a>

            {selectedTopic 
                ? 
                    <table>
                        <tbody>
                            <tr>
                                <td>
                                    <input type='checkbox' checked={selectedRuleIdxs.length == selectedTopic.rules.length}  onChange={
                                        e => {
                                            if (e.target.checked) {
                                                onChanged(selectedTopic.rules.map(rule => rule.ruleIdx));
                                            } else {
                                                onChanged([selectedTopic.rules[0].ruleIdx]);
                                            }
                                        }
                                    }/>
                                </td>
                            </tr>
                            {selectedTopic.rules.map(rule => 
                                <tr key={rule.ruleIdx}>
                                    <td><input type='checkbox' checked={selectedRuleIdxs.indexOf(rule.ruleIdx) >= 0}  onChange={
                                        e => {
                                            if (e.target.checked) {
                                                onChanged(selectedRuleIdxs.concat([rule.ruleIdx]));
                                            } else {
                                                if (selectedRuleIdxs.length > 1) {
                                                    onChanged(selectedRuleIdxs.filter(ruleIdx => ruleIdx != rule.ruleIdx));
                                                }
                                            }
                                        }
                                    }/></td>
                                    <td><a href='#' onClick={(e) => {
                                        e.preventDefault();
                                        if (selectedRuleIdxs.indexOf(rule.ruleIdx) >= 0 && selectedRuleIdxs.length > 1) {
                                            onChanged(selectedRuleIdxs.filter(ruleIdx => ruleIdx != rule.ruleIdx))
                                        } else {
                                            onChanged(selectedRuleIdxs.concat([rule.ruleIdx]));
                                        }
                                    }}>{rule.nodeTitle.replace('Rule: ', '')}</a></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                : null
            }
            
    </div>;
}

