import React from "react";
import { beforeEach, expect } from '@jest/globals';
import { fireEvent, render, RenderResult, screen, cleanup, act } from '@testing-library/react';

import FilterLinkComponent from './FilterLinkComponent';
import TaskSuggester, { TopicType } from "./TaskSuggester";

describe('FilterLinkComponent', () => {

    let taskSuggester!: TaskSuggester;
    
    beforeEach( () => {
        taskSuggester = new TaskSuggester(`

# Topic 0

## Rule 0

### Task 0

? (hello|world)
! hello

## Rule 1

### Task 1

? (hello|world)
! hello

# Topic 1

## Rule 2

### Task 2

? (hello|world)
! hello

## Rule 3

### Task 3

? (hello|world)
! hello


# Topic 2       

## Rule 4

### Task 4

? (hello|world)
! hello

## Rule 5

### Task 5

? (hello|world)
! hello

# Topic 3

## Rule 6

### Task 6

? (hello|world)
! hello

## Rule 7

### Task 7

? (hello|world)
! hello

    `);
    });

    test('all, no answers', () => {
        const component = render(<FilterLinkComponent 
            selectedRuleIdxs={new Set<number>()}  
            topics={taskSuggester.getTopics()}
            isActive={false}
            onClicked={() => {}}
        />);
        expect(component.getByText('All')).toBeDefined();
    });

    test('less than 3, no answers', () => {
        const component = render(<FilterLinkComponent 
            selectedRuleIdxs={new Set<number>([0, 1,2])}  
            topics={taskSuggester.getTopics()}
            isActive={false}
            onClicked={() => {}}
        />);
        expect(component.getByText('Topic 0, Topic 1 (partial)')).toBeDefined();
    });

    test('more than 3, no answers', () => {
        const component = render(<FilterLinkComponent 
            selectedRuleIdxs={new Set<number>([1, 2, 3, 4, 5, 6, 7])}  
            topics={taskSuggester.getTopics()}
            isActive={false}
            onClicked={() => {}}
        />);
        expect(component.getByText('Topic 0 (partial), Topic 1, Topic 2... (total 4)')).toBeDefined();
    });

    test('stats', () => {
        taskSuggester.recordAnswer(0, true);
        taskSuggester.recordAnswer(1, false);
        const component = render(<FilterLinkComponent 
            selectedRuleIdxs={new Set<number>([0, 1,2])}  
            topics={taskSuggester.getTopics()}
            isActive={false}
            onClicked={() => {}}
        />);
        expect(component.getByText('50%')).toBeDefined();
    });

    test('stats ignored for unselected nodes', () => {
        taskSuggester.recordAnswer(0, true);
        taskSuggester.recordAnswer(1, false);
        taskSuggester.recordAnswer(4, false);
        const component = render(<FilterLinkComponent 
            selectedRuleIdxs={new Set<number>([0, 1,2])}  
            topics={taskSuggester.getTopics()}
            isActive={false}
            onClicked={() => {}}
        />);
        expect(component.getByText('50%')).toBeDefined();
    });

    test('active', () => {
        const component = render(<FilterLinkComponent 
            selectedRuleIdxs={new Set<number>()}  
            topics={taskSuggester.getTopics()}
            isActive={true}
            onClicked={() => {}}
        />);
        expect(component.getByText('All').className).toBe('active');
    });

    test('onClicked', () => {
        let clicked = false;
        const component = render(<FilterLinkComponent 
            selectedRuleIdxs={new Set<number>()}  
            topics={taskSuggester.getTopics()}
            isActive={true}
            onClicked={() => { clicked = true}}
        />);
        fireEvent.click(component.getByText('All'));
        expect(clicked).toBeTruthy();
    });

});