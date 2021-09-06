import React, { useEffect } from "react";
import { TopicType } from "./TaskSuggester";
import './FilterLinkComponent.scss';

type FilterLinkPropsType = {
    selectedRuleIdxs: Set<number>,
    topics: Array<TopicType>,
    isActive: boolean,
    onClicked: () => void
}

// TODO: add tests
export default function ({ selectedRuleIdxs, topics, isActive, onClicked } : FilterLinkPropsType) {
    let topicsStr = '';
    let selectedTopics: Array<TopicType> = [];
    if (selectedRuleIdxs.size == 0) {
        topicsStr = 'All';
        selectedTopics = topics;
    } else {
        selectedTopics = topics.filter(topic => topic.rules.find(rule => selectedRuleIdxs.has(rule.ruleIdx)));

        const selectedTopicTitles = selectedTopics.map(topic => {
            if (topic.rules.length > topic.rules.filter(rule => selectedRuleIdxs.has(rule.ruleIdx)).length) {
                return topic.title + ' (partial)';
            }
            return topic.title;
        });

        if (selectedTopics.length > 3) {
            topicsStr = selectedTopicTitles.slice(0, 3).join(', ') + '... (total ' + selectedTopics.length + ')';
        } else {
            topicsStr = selectedTopicTitles.join(', ');
        }
    }

    let correctlyAnswered = 0;
    let incorrectlyAnswered = 0;
    selectedTopics.forEach(topic =>
        topic.rules.forEach(rule => {
            if (selectedRuleIdxs.size == 0 || selectedRuleIdxs.has(rule.ruleIdx)) {
                correctlyAnswered += rule.stats.correctlyAnsweredTasks;
                incorrectlyAnswered += rule.stats.incorrectlyAnsweredTasks;
            }
        }));

    const percentSuccess = correctlyAnswered + incorrectlyAnswered > 0 
            ? Math.floor(correctlyAnswered * 100 / (correctlyAnswered + incorrectlyAnswered))
            : -1;
            

    return <span className='FilterLinkComponent'>
        <a className={isActive ? 'active' : 'inactive'} href='#' onClick={
            (e) => {
                e.preventDefault();
                onClicked();
            }
        }>{topicsStr}
            {percentSuccess >= 0 
                ? <span> {percentSuccess}%</span>
                : null
            }
        </a>
    </span>
}