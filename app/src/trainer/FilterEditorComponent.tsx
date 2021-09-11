import React, { useState } from 'react';

import { RuleType, StatsType, TopicType } from './TaskSuggester';

import './FilterEditorComponent.scss';

import IndeterminateCheckbox, { CheckboxState } from './IndeterminateCheckbox';

export type TopicSelectorComponentProps = {
    topics: Array<TopicType>,
    selectedRuleIdxs: Set<number>,
    onChanged: (newRuleIdxs: Set<number>) => void,
    onClose: () => void
}

enum SortEnum {
    NATURAL,
    WORST_TO_BEST,
    BEST_TO_WORST
};

function statsToPct(stats: StatsType): number | undefined {
    if (stats.correctlyAnsweredTasks + stats.incorrectlyAnsweredTasks > 0) {
        return Math.floor(100 * stats.correctlyAnsweredTasks / (stats.correctlyAnsweredTasks + stats.incorrectlyAnsweredTasks));
    } 
}


function renderStats(stats: StatsType): React.ReactNode {
    return <span>
        {statsToPct(stats) !== undefined ? statsToPct(stats) + '%' : ''}
    </span>
}


function renderTopic(topic: TopicType, 
    topics: Array<TopicType>,
    selectedRuleIdxs: Set<number>, 
    onChanged: (newRuleIdxs: Set<number>) => void,
    isExpanded: boolean,
    setIsExpanded: (newIsExpanded: boolean) => void,
    sortOrder: SortEnum
): any {
    const topicCheckState = calculateTopicCheckboxState(topic, selectedRuleIdxs);
    return <tr key={topic.topicIdx} className="topicRow">
        <td>
            <IndeterminateCheckbox state={topicCheckState} debug={topic.title}
                onClick={() => {
                    onChanged(mapAllToEmpty(recalculateSelectedRuleIdxsOnTopicClick(topics, topic, selectedRuleIdxs), topics))
                }}
             /> 
                {/* {topicCheckState == CheckboxState.CHECKED
                    ? "study all"
                    : (
                        topicCheckState == CheckboxState.INDETERMINATE
                            ? "study selected"
                            : null
                    )
                } */}
        </td>
        <td>
            {topic.title} <a href='#' onClick={(e)=> {
                e.preventDefault();
                setIsExpanded(!isExpanded);
            }}>{isExpanded ? "collapse" : "expand"}</a>
            {isExpanded
                ?   <table>
                        <tbody>
                            {topic.rules.map(rule => {
                                const state = calculateRuleCheckboxState(rule, selectedRuleIdxs);
                                return    <tr key={rule.ruleIdx}>
                                    <td><IndeterminateCheckbox state={state} onClick={
                                        () => {
                                            onChanged(mapAllToEmpty(recalculateSelectedRuleIdxsOnRuleClick(topics, rule, selectedRuleIdxs), topics))
                                        } 
                                    }
                                    debug={rule.nodeTitle}
                                    /> 
                                        {/* {state == CheckboxState.CHECKED 
                                             ? "study"
                                             : null
                                         } */}
                                    </td>
                                    <td>
                                        {rule.nodeTitle.replace("Rule: ", "")}
                                    </td>
                                    <td>
                                        {renderStats(rule.stats)}
                                    </td>
                                </tr>
                            })}
                        </tbody>

                    </table>

                : null
            }
        </td>
        <td>
            {renderStats(topic.stats)}
        </td>

    </tr>;
}

// TODO: cover with tests
export default function({ topics,  selectedRuleIdxs, onChanged, onClose }: TopicSelectorComponentProps ) {

    let sortedTopics = topics;

    const [sortOrder, setSortOrder] = useState<SortEnum>(SortEnum.NATURAL);
    const [isExpanded, setIsExpanded] = useState<Array<boolean>>(topics.map(topic => false));

    if (sortOrder != SortEnum.NATURAL) {
        sortedTopics.sort((a, b) => 
            (statsToPct(a.stats) || 0) - (statsToPct(b.stats) || 0)
        );
    }

    return <div className='FilterEditorComponent'>

            <div><a href='#' onClick={(e) => {e.preventDefault(); onClose(); }}>Close</a></div>

            <h1>Select topics to study:</h1>

            <div><IndeterminateCheckbox state={calcuateAllCheckboxState(topics, selectedRuleIdxs)} debug={'All'} 
                onClick={() =>
                    onChanged(mapAllToEmpty(recalculateSelectedRuleIdxsOnAllClicked(topics, selectedRuleIdxs), topics))
                }
            />
            
                    {/* Study {selectedRuleIdxs.size == 0 ? "everything" : "selected"} */}
            </div>
            <div>Sorting: 
                <select>
                    <option value={SortEnum.NATURAL}>natural order</option>
                    <option value={SortEnum.WORST_TO_BEST}>from worst to best</option>
                    <option value={SortEnum.BEST_TO_WORST}>from best to worst</option>
                </select>
            </div>

            <table>
                <tbody>
                    {topics.map(topic => {
                        return renderTopic(topic, topics, selectedRuleIdxs, onChanged, isExpanded[topic.topicIdx], (newExpanded) => {
                            isExpanded[topic.topicIdx] = newExpanded;
                            setIsExpanded(JSON.parse(JSON.stringify(isExpanded)));
                        }, sortOrder);
                    })}
                </tbody>
            </table>

        </div>;

}
function calcuateAllCheckboxState(topics: TopicType[], selectedRuleIdxs: Set<number>): CheckboxState {
    if (selectedRuleIdxs.size == 0) {
        return CheckboxState.CHECKED;
    }
    return CheckboxState.INDETERMINATE;
}

function calculateTopicCheckboxState(topic: TopicType, selectedRuleIdxs: Set<number>): CheckboxState {
    if (selectedRuleIdxs.size == 0) {
        return CheckboxState.CHECKED;
    }
    
    const selectedRulesCount = topic.rules.filter(rule => selectedRuleIdxs.has(rule.ruleIdx)).length;
    if (selectedRulesCount == 0) {
        return CheckboxState.UNCHECKED;
    }

    if (selectedRulesCount == topic.rules.length) {
        return CheckboxState.CHECKED;  
    }
    return CheckboxState.INDETERMINATE;
}

function calculateRuleCheckboxState(rule: RuleType, selectedRuleIdxs: Set<number>): CheckboxState {
    return selectedRuleIdxs.size == 0 ||  selectedRuleIdxs.has(rule.ruleIdx) ? CheckboxState.CHECKED : CheckboxState.UNCHECKED;
}

function recalculateSelectedRuleIdxsOnRuleClick(topics: Array<TopicType>, rule: RuleType, selectedRuleIdxs: Set<number>): Set<number> {
    const state = calculateRuleCheckboxState(rule, selectedRuleIdxs);
    const newSelection = new Set<number>(selectedRuleIdxs);
    if (state != CheckboxState.CHECKED) {
        newSelection.add(rule.ruleIdx);
        return newSelection;
    }
    if (selectedRuleIdxs.size == 1 && selectedRuleIdxs.has(rule.ruleIdx)) {
        return newSelection;
    }
    if (selectedRuleIdxs.size == 0) {
        topics.forEach(topicIter => {
            topicIter.rules.forEach(ruleIter => {
                if (ruleIter.ruleIdx != rule.ruleIdx) {
                    newSelection.add(ruleIter.ruleIdx);
                }
            })
        })
    } else {
        newSelection.delete(rule.ruleIdx);
    }
    return newSelection;
}

function recalculateSelectedRuleIdxsOnAllClicked(topics: Array<TopicType>, selectedRuleIdxs: Set<number>): Set<number> {
    const state = calcuateAllCheckboxState(topics, selectedRuleIdxs);
    if (state == CheckboxState.CHECKED) {
        return new Set<number>([topics[0].rules[0].ruleIdx]);
    }
    return new Set<number>([]);
}

function mapAllToEmpty(newSelectedRuleIdx:Set<number>, topics: Array<TopicType>): Set<number> {
    if (newSelectedRuleIdx.size == topics.reduce((old, topic) => old + topic.rules.length, 0)) {
        return new Set<number>([]);
    }
    return newSelectedRuleIdx;
}

function recalculateSelectedRuleIdxsOnTopicClick(topics: Array<TopicType>,topic: TopicType, selectedRuleIdxs: Set<number>): Set<number> {
    const newSelection = new Set<number>(selectedRuleIdxs);
    const state = calculateTopicCheckboxState(topic, selectedRuleIdxs);
    if (state != CheckboxState.CHECKED) {
        topic.rules.forEach(rule => {
            newSelection.add(rule.ruleIdx);
        })
        return newSelection;
    }

    if (selectedRuleIdxs.size == 0) {
        topics.filter(iterTopic => iterTopic.topicIdx != topic.topicIdx).forEach(iterTopic => {
            iterTopic.rules.forEach(rule => {
                newSelection.add(rule.ruleIdx);
            })
        });
        return newSelection;
    }

    topic.rules.forEach(rule => {
        newSelection.delete(rule.ruleIdx);
    });
    if (newSelection.size == 0) {
        newSelection.add(topic.rules[0].ruleIdx);
    }
    return newSelection;
}

