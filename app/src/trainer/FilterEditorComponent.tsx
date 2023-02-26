import React, { MutableRefObject, RefObject, useEffect, useRef, useState } from 'react';

import { RuleType, StatsType, TopicType } from './TaskSuggester';

import './FilterEditorComponent.scss';

import IndeterminateCheckbox, { CheckboxState } from './IndeterminateCheckbox';

import { Language  } from './LanguageType';

export type TopicSelectorComponentProps = {
    topics: Array<TopicType>,
    selectedRuleIdxs: Set<number>,
    onChanged: (newRuleIdxs: Set<number>, shouldClose: boolean) => void,
    onClose: () => void,
    lang: Language,

    highlightedTopicIdx: number,
    highlightedRuleIdx: number
}

enum SortEnum {
    NATURAL,
    WORST_TO_BEST,
    BEST_TO_WORST
};

function successfulRateStatsToPct(stats: StatsType): number | undefined {
    if (stats.correctlyAnsweredTaskIdxs.size + stats.incorrectlyAnsweredTaskIdxs.size > 0) {
        return Math.floor(100 * stats.correctlyAnsweredTaskIdxs.size / (stats.correctlyAnsweredTaskIdxs.size + stats.incorrectlyAnsweredTaskIdxs.size));
    } 
}

function totalStatsToPct(stats: StatsType): number | undefined {
    if (stats.totalTasks) {
        return Math.floor(100 * (stats.correctlyAnsweredTaskIdxs.size + stats.incorrectlyAnsweredTaskIdxs.size) / stats.totalTasks);
    } 
}


function renderStats(stats: StatsType): React.ReactNode {
    const successRatePct = successfulRateStatsToPct(stats);
    const totalPct = totalStatsToPct(stats);
    return  (successRatePct !== undefined && totalPct !== undefined)
            ? <span>
                <span className={caculatePercentClassName(successRatePct)}>{successRatePct}%</span>&nbsp;/&nbsp;
                <span className={caculatePercentClassName(totalPct)}>{totalPct}%</span>
             </span>
            : null; 

}


function renderTopic(highlightedRef: RefObject<HTMLTableRowElement>, topic: TopicType, 
    topics: Array<TopicType>,
    selectedRuleIdxs: Set<number>, 
    onChanged: (newRuleIdxs: Set<number>, shouldClose: boolean) => void,
    sortOrder: SortEnum,
    highlightedRuleIdx: number,
    lang: Language
): any {
    const topicCheckState = calculateTopicCheckboxState(topic, selectedRuleIdxs);
    const onTopicClick = (e?: any) => {
        e?.preventDefault();
        onChanged(mapAllToEmpty(recalculateSelectedRuleIdxsOnTopicClick(topics, topic, selectedRuleIdxs), topics), false)
    };

    const onTopicStudy = (e?: any) => {
        e?.preventDefault();
        onChanged(new Set(topic.rules.map(rule => rule.ruleIdx)), true);
    };

    return <tr key={topic.topicIdx} className="topicRow">
        <td className="firstCol">
            <IndeterminateCheckbox state={topicCheckState} debug={topic.title}
                onClick={onTopicClick}
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
            <span onClick={onTopicClick}>{topic.title}</span> (<a href="#" onClick={onTopicStudy}>{lang.STUDY_ACTION}</a>)
                
            <table>
                <tbody>
                    {topic.rules.map(rule => {
                        const state = calculateRuleCheckboxState(rule, selectedRuleIdxs);

                        const onClick = (e?: any) => {
                            e?.preventDefault();
                            onChanged(mapAllToEmpty(recalculateSelectedRuleIdxsOnRuleClick(topics, rule, selectedRuleIdxs), topics), false)
                        };

                        const doStudy = (e?: any) => {
                            e?.preventDefault();
                            onChanged(new Set([rule.ruleIdx]), true);
                        };

                        return    <tr 
                                key={rule.ruleIdx} 
                                className={rule.ruleIdx == highlightedRuleIdx ? 'highlighted' : ''}
                                ref={rule.ruleIdx == highlightedRuleIdx ? highlightedRef : null}
                        >
                            <td><IndeterminateCheckbox state={state} onClick={onClick}
                            debug={rule.nodeTitle}
                            /> 
                                {/* {state == CheckboxState.CHECKED 
                                        ? "study"
                                        : null
                                    } */}
                            </td>
                            <td onClick={onClick} className={rule.nodeTitle.indexOf("debug") > 0 ? "debug" : ""}>
                                {rule.nodeTitle.replace("Rule: ", "")}
                            </td>
                            <td>
                                <a href='#' onClick={doStudy}>{lang.STUDY_ACTION}</a>
                            </td>
                            <td>
                                {renderStats(rule.stats)}
                            </td>
                        </tr>
                    })}
                </tbody>

            </table>
       </td>
        <td>
            {renderStats(topic.stats)}
        </td>

    </tr>;
}

// TODO: cover with tests
export default function({ topics,  selectedRuleIdxs, onChanged, onClose, highlightedTopicIdx, highlightedRuleIdx, lang }: TopicSelectorComponentProps ) {

    let sortedTopics = topics;

    const [sortOrder, setSortOrder] = useState<SortEnum>(SortEnum.NATURAL);
    const [isEmpty, setIsEmpty] = useState<boolean>(false);
    const [isScrolledIntoView, setIsScrolledIntoView] = useState<boolean>(false);

    const highlightedRef: MutableRefObject<HTMLTableRowElement | null> = useRef<HTMLTableRowElement>(null);

    useEffect(() => {
        if (highlightedRef && highlightedRef.current && highlightedRef.current.scrollIntoView && !isScrolledIntoView) {
            highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setIsScrolledIntoView(true);
        }
      }, [highlightedRef, highlightedRef?.current]);

    if (sortOrder != SortEnum.NATURAL) {
        sortedTopics.sort((a, b) => 
            (successfulRateStatsToPct(a.stats) || 0) - (successfulRateStatsToPct(b.stats) || 0)
        );
    }

    let fixedSelectedRuleIdx = selectedRuleIdxs;
    if (selectedRuleIdxs.size == 0 && !isEmpty) {
        fixedSelectedRuleIdx = new Set(topics.flatMap(topic => topic.rules.map(rule => rule.ruleIdx)));
    }

    return <div className='FilterEditorComponent'>

            <div className="header">
                <div className="back left">
                    <a href='#' onClick={(e) => {e.preventDefault(); onClose(); }}><img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAOCAYAAABth09nAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA0UlEQVRIx9XUMU5CQRDG8Z8IBSQ2dBSUVHAACuzs6DyCDdQcwMoLUJvQcQmIN7CCK2htIpHGECweBTHPx8NHMvBPJruzO8X37WaGw9Ry1IRznXFXxRgNvEYL/S9tLLHFMFpMHkq/8isMJD/QiRZ3DOW9fR3PuI8WVcTILaZoptTcSPrknPmEO2wk/ZAWHxl35xKjMl7whMcMt+voJz/A137ygO8Utxc3tSboYxUtqqgRmKGH92hhRY3AAt3dejGU/jh/k4zkebTAU1FBK1pEHn4AnPxK6IraSqsAAAAASUVORK5CYII=' /></a>
                    <br />
                    <a href='#' onClick={(e) => {e.preventDefault(); onClose(); }}>{lang.BACK_TO_STUDY_LINK}</a>
                </div>

                <h1>{lang.SELECT_TOPICS_HEADER}:</h1>
                <div className="right">&nbsp; {lang.BACK_TO_STUDY_LINK} &nbsp;</div>
            </div>
        

            <div className="tableContainer">
                <div className="tableHeader">
                    <div className="firstCol">
                        <IndeterminateCheckbox state={calcuateAllCheckboxState(topics, fixedSelectedRuleIdx)} debug={'All'} 
                            onClick={() => {
                                const newSelectedRuleIdx = recalculateSelectedRuleIdxsOnAllClicked(topics, fixedSelectedRuleIdx);
                                setIsEmpty(newSelectedRuleIdx.size == 0);
                                onChanged(mapAllToEmpty(newSelectedRuleIdx, topics), false);
                            }}
                        />
                    </div>
                    <div className="sorting">
                        {lang.SUCCESS_STATS_LINK_PREFIX} % / {lang.TOTAL_STATS_LINK_PREFIX} %
                            {/* <select>
                                <option value={SortEnum.NATURAL}>natural order</option>
                                <option value={SortEnum.WORST_TO_BEST}>from worst to best</option>
                                <option value={SortEnum.BEST_TO_WORST}>from best to worst</option>
                            </select> */}
                    </div>
                </div>

                <div className="mainFilterTableContainer">
                    <table className="mainFilterTable">
                        <tbody>
                            {topics.map(topic => {
                                return renderTopic(highlightedRef, topic, topics, fixedSelectedRuleIdx, (newRuleIdxs: Set<number>, shouldClose: boolean) => {
                                    setIsEmpty(newRuleIdxs.size == 0);
                                    onChanged(newRuleIdxs, shouldClose);
                                }, sortOrder, highlightedRuleIdx, lang);
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>;

}
function calcuateAllCheckboxState(topics: TopicType[], selectedRuleIdxs: Set<number>): CheckboxState {
    if (selectedRuleIdxs.size == 0) {
        return CheckboxState.UNCHECKED;
    }
    if (selectedRuleIdxs.size == countAllRules(topics)) {
        return CheckboxState.CHECKED;
    }
    return CheckboxState.INDETERMINATE;
}

function calculateTopicCheckboxState(topic: TopicType, selectedRuleIdxs: Set<number>): CheckboxState {
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
    return selectedRuleIdxs.has(rule.ruleIdx) ? CheckboxState.CHECKED : CheckboxState.UNCHECKED;
}

function recalculateSelectedRuleIdxsOnRuleClick(topics: Array<TopicType>, rule: RuleType, selectedRuleIdxs: Set<number>): Set<number> {
    const state = calculateRuleCheckboxState(rule, selectedRuleIdxs);
    const newSelection = new Set<number>(selectedRuleIdxs);
    if (state == CheckboxState.CHECKED) {
        newSelection.delete(rule.ruleIdx);
    } else {
        newSelection.add(rule.ruleIdx);
    }
    return newSelection;
}

function recalculateSelectedRuleIdxsOnAllClicked(topics: Array<TopicType>, selectedRuleIdxs: Set<number>): Set<number> {
    const state = calcuateAllCheckboxState(topics, selectedRuleIdxs);
    if (state == CheckboxState.CHECKED) {
        return new Set<number>([]);
    } else {
        return new Set(topics.flatMap(topic => topic.rules.map(rule => rule.ruleIdx)));
    }
}

function countAllRules(topics: Array<TopicType>) {
    return topics.reduce((old, topic) => old + topic.rules.length, 0);
}

function mapAllToEmpty(newSelectedRuleIdx:Set<number>, topics: Array<TopicType>): Set<number> {
    if (newSelectedRuleIdx.size == countAllRules(topics)) {
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
    } else {
        topic.rules.forEach(rule => {
            newSelection.delete(rule.ruleIdx);
        });
    }
    return newSelection;
}

function caculatePercentClassName(percentSuccess: number): string  {
    if (percentSuccess > 75) {
        return 'greenPct';
    } else if (percentSuccess > 50) {
        return 'yellowPct';
    }
    return 'redPct';
}

