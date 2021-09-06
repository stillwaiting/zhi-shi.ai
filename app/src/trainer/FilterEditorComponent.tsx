import React from 'react';

import { TopicType } from './TaskSuggester';

export type TopicSelectorComponentProps = {
    topics: Array<TopicType>,
    selectedRuleIdxs: Set<number>,
    onChanged: (newRuleIdxs: Set<number>) => void,
    onClose: () => void
}

function findTopic(topics: TopicType[], currentlySelectedRuleIdx: number[]): TopicType | undefined {
    if (currentlySelectedRuleIdx.length == 0) {
        return undefined;
    }
    return topics.find(topic => !!topic.rules.find(rule => rule.ruleIdx == currentlySelectedRuleIdx[0]))!;
}

// TODO: cover with tests
export default function({ topics,  selectedRuleIdxs, onChanged, onClose }: TopicSelectorComponentProps ) {
    // const selectedTopic = findTopic(topics, selectedRuleIdxs);
    // return <div className='TopicSelectorComponent'>
    //         <select value={(selectedTopic == undefined ? -1 : selectedTopic.topicIdx)} onChange={(e) => {
    //             if (e.target.value == "-1") {
    //                 onChanged([]);
    //             } else {
    //                 onChanged(topics[parseInt(e.target.value)].rules.map(rule => rule.ruleIdx));
    //             }

    //         }}>
    //             <option value={-1}>All</option>
    //             {topics.map(topic => 
    //                 <option key={topic.topicIdx} value={topic.topicIdx}>{topic.title}</option>
    //             )}
    //         </select>

    //         <a href='#' onClick={
    //             (e) => {
    //                 e.preventDefault();
    //                 onClose();
    //             }
    //         }>[close]</a>

    //         {selectedTopic 
    //             ? 
    //                 <table>
    //                     <tbody>
    //                         <tr>
    //                             <td>
    //                                 <a href='#' onClick={
    //                                     e => {
    //                                         e.preventDefault();
    //                                         onChanged(selectedTopic.rules.map(rule => rule.ruleIdx));
    //                                     }}>select all</a> | 

    //                                 <a href='#' onClick={
    //                                     e => {
    //                                         e.preventDefault();
    //                                         onChanged([selectedTopic.rules[0].ruleIdx]);
    //                                     }}>unselect all</a>
    //                             </td>
    //                         </tr>
    //                         {selectedTopic.rules.map(rule => 
    //                             <tr key={rule.ruleIdx}>
    //                                 <td><input type='checkbox' checked={selectedRuleIdxs.indexOf(rule.ruleIdx) >= 0}  onChange={
    //                                     e => {
    //                                         if (e.target.checked) {
    //                                             onChanged(selectedRuleIdxs.concat([rule.ruleIdx]));
    //                                         } else {
    //                                             if (selectedRuleIdxs.length > 1) {
    //                                                 onChanged(selectedRuleIdxs.filter(ruleIdx => ruleIdx != rule.ruleIdx));
    //                                             }
    //                                         }
    //                                     }
    //                                 }/></td>
    //                                 <td><a href='#' onClick={(e) => {
    //                                     e.preventDefault();
    //                                     if (selectedRuleIdxs.indexOf(rule.ruleIdx) >= 0 && selectedRuleIdxs.length > 1) {
    //                                         onChanged(selectedRuleIdxs.filter(ruleIdx => ruleIdx != rule.ruleIdx))
    //                                     } else {
    //                                         onChanged(selectedRuleIdxs.concat([rule.ruleIdx]));
    //                                     }
    //                                 }}>{rule.nodeTitle.replace('Rule: ', '')}</a></td>
    //                             </tr>
    //                         )}
    //                     </tbody>
    //                 </table>
    //             : null
    //         }
    // </div>;
    return null;
}

