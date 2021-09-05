import React, { useEffect } from "react";
import { TopicType } from "./TaskSuggester";

type FilterLinkPropsType = {
    selectedRuleIdxs: Array<number>,
    topics: Array<TopicType>,
    onClicked: () => void
}

// TODO: add tests
export default function ({ selectedRuleIdxs, topics, onClicked } : FilterLinkPropsType) {
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

    return <div>
        <a href='#' onClick={
            (e) => {
                e.preventDefault();
                onClicked();
            }
        }>Filter: {label}</a>
    </div>
}