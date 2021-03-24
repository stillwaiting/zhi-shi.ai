import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import QuestionAnswerComponent from './QuestionAnswerComponent';
import '@testing-library/jest-dom'

test('does not show answers before submit', () => {
    const component = render(<QuestionAnswerComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" answers={["answer 1", "answer 2"]} />);
    expect(component.container.getElementsByClassName('answer').length).toBe(0);
});

test('shows answers after submit', () => {
    const component = render(<QuestionAnswerComponent sentence="(Hello|blah|baz), (world|foo)" answers={["answer 1", "answer 2"]} />);
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