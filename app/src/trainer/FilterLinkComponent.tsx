import React, { useEffect } from "react";
import { TopicType } from "./TaskSuggester";
import './FilterLinkComponent.scss';
import {Language} from './LanguageType';

type FilterLinkPropsType = {
    selectedRuleIdxs: Set<number>,
    topics: Array<TopicType>,
    isActive: boolean,
    onClicked: () => void,
    lang: Language
}

// TODO: add tests
export default function ({ selectedRuleIdxs, topics, isActive, onClicked, lang } : FilterLinkPropsType) {
    let topicsStr = '';
    let selectedTopics: Array<TopicType> = [];
    if (selectedRuleIdxs.size == 0) {
        topicsStr = lang.ALL;
        selectedTopics = topics;
    } else {
        selectedTopics = topics.filter(topic => topic.rules.find(rule => selectedRuleIdxs.has(rule.ruleIdx)));

        const selectedTopicTitles = selectedTopics.map(topic => {
            if (topic.rules.length > topic.rules.filter(rule => selectedRuleIdxs.has(rule.ruleIdx)).length) {
                return topic.title + ` (${lang.PARTIAL_LINK})`;
            }
            return topic.title;
        });

        if (selectedTopics.length > 3) {
            topicsStr = selectedTopicTitles.slice(0, 3).join(', ') + `... (${lang.TOTAL} ` + selectedTopics.length + ')';
        } else {
            topicsStr = selectedTopicTitles.join(', ');
        }
    }

    let correctlyAnswered = 0;
    let incorrectlyAnswered = 0;
    let totalAnswered = 0;
    let totalTasks = 0;
    selectedTopics.forEach(topic =>
        topic.rules.forEach(rule => {
            if (selectedRuleIdxs.size == 0 || selectedRuleIdxs.has(rule.ruleIdx)) {
                correctlyAnswered += rule.stats.correctlyAnsweredTaskIdxs.size;
                incorrectlyAnswered += rule.stats.incorrectlyAnsweredTaskIdxs.size;
                totalAnswered += rule.stats.correctlyAnsweredTaskIdxs.size + rule.stats.incorrectlyAnsweredTaskIdxs.size;
                totalTasks += rule.stats.totalTasks;
            }
        }));

    const percentSuccess = correctlyAnswered + incorrectlyAnswered > 0 
            ? Math.floor(correctlyAnswered * 100 / (correctlyAnswered + incorrectlyAnswered))
            : 0;
            
    const percentTotal = totalTasks > 0
            ? Math.floor(totalAnswered * 100 / totalTasks)
            : 0;

    return <span className='FilterLinkComponent'>
        <a className={isActive ? 'active' : 'inactive'} data-testid='filter-link' href='#' onClick={
            (e) => {
                e.preventDefault();
                onClicked();
            }
        }>{lang.STUDY_LINK_PREFIX}: {topicsStr.toLocaleLowerCase()}
            <br /><span>
            {percentSuccess >= 0 
                ? <span>
                    {lang.SUCCESS_STATS_LINK_PREFIX}: <span className={caculatePercentClassName(percentSuccess)}>{percentSuccess}%</span>.&nbsp;
                    {lang.TOTAL_STATS_LINK_PREFIX}: <span className={caculatePercentClassName(percentTotal)}>{percentTotal}%</span>&nbsp;
                 </span>
                : null
            }
            &nbsp;</span>
        </a>
    </span>
}

function caculatePercentClassName(percentSuccess: number): string  {
    if (percentSuccess > 75) {
        return 'greenPct';
    } else if (percentSuccess > 50) {
        return 'yellowPct';
    }
    return 'redPct';
}
