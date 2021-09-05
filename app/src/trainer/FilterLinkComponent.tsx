import React, { useEffect } from "react";
import { TopicType } from "./TaskSuggester";
import './FilterLinkComponent.scss';

type FilterLinkPropsType = {
    selectedRuleIdxs: Array<number>,
    topics: Array<TopicType>,
    isActive: boolean,
    onClicked: () => void
}

// TODO: add tests
export default function ({ selectedRuleIdxs, topics, isActive, onClicked } : FilterLinkPropsType) {
    let label = '';
    if (selectedRuleIdxs.length == 0) {
        label = 'All';
    } else {
        const ruleIdx = selectedRuleIdxs[0];
        const topic = topics.find(topic => topic.rules.map(rule => rule.ruleIdx).indexOf(ruleIdx) >= 0)!;
        if (topic.rules.length == selectedRuleIdxs.length) {
            label = topic.title + " (all)";
        } else {
            label = topic.title + ` (${selectedRuleIdxs.length} of ${topic.rules.length})`;
        }
    }

    return <span className='FilterLinkComponent'>
        <a className={isActive ? 'active' : 'inactive'} href='#' onClick={
            (e) => {
                e.preventDefault();
                onClicked();
            }
        }>Filter: {label}</a>
    </span>
}