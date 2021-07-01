import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BodyQuestionAnswerComponent from './BodyQuestionAnswerComponent';
import '@testing-library/jest-dom'

describe('BodyQuestionAnswerComponent', () => {
    test('does not show answers before submit', () => {
        const component = render(<BodyQuestionAnswerComponent data={{
            question: {text: "(Hello|blah|baz), (world|foo)(!|.)"},
            answers: [{text: "answer 1"}, {text: "answer 2"}]
        }} onLinkClicked = {() => {}} />);
        expect(component.container.getElementsByClassName('answer').length).toBe(0);
    });

    test('shows answers after submit', () => {
        const component = render(<BodyQuestionAnswerComponent data={{
            question: {text: "(Hello|blah|baz), (world|foo)"},
            answers: [{text: "answer 1"}, {text: "answer 2"}]
        }} onLinkClicked = {() => {}} />);
        const firstSelect = component.container.getElementsByTagName('select')[1]
        fireEvent.change(firstSelect, {
            target: {value: firstSelect.getElementsByTagName('option')[1].value}
        });
        fireEvent.click(component.container.getElementsByTagName('button')[0]);

        const answers = component.container.getElementsByClassName('answer')
        expect(answers.length).toBe(2);
        expect(answers[0].innerHTML).toContain("class=\"success\"")
        expect(answers[0].innerHTML).toContain("answer 1")
        expect(answers[1].innerHTML).toContain("class=\"error\"")
        expect(answers[1].innerHTML).toContain("answer 2")
    });
});