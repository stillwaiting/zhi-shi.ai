import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SentenceComponent from './SentenceComponent';
import '@testing-library/jest-dom'

test('renders without dropdowns', () => {
    const component = render(<SentenceComponent sentence="Hello, world!" isAnswerMode={false} onSubmit={() => {}} />);
    const text = screen.getByText(/Hello, world!/i);
    expect(text).toBeInTheDocument();
    expect(component.container.getElementsByTagName('select')).toHaveLength(0);
});

test('renders with dropdowns', () => {
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" isAnswerMode={false} onSubmit={() => {}} />);
    const selects = component.container.getElementsByTagName('select');
    expect(selects).toHaveLength(3);
    const expected = [
        ['Hello', 'blah', 'baz'],
        ['world', 'foo'],
        ['!', '.']
    ];
    expected.forEach((options, selectIdx) => {
       options.forEach((option, optionIdx) => {
            expect(selects[selectIdx].getElementsByTagName('option')[optionIdx].innerHTML).toEqual(option);
       });
    });
});

test('onSubmit returns empty array when no dropdowns', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="Hello, world!" isAnswerMode={false} onSubmit={(submitted) => {
        caughtValue = submitted;
    }} />);
    fireEvent.click(component.container.getElementsByTagName('button')[0]);
    expect(caughtValue).toHaveLength(0);
});

test('onSubmit returns array of zeros when no values were selected', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" isAnswerMode={false} onSubmit={(submitted) => {
        caughtValue = submitted;
    }} />);
    fireEvent.click(component.container.getElementsByTagName('button')[0]);
    expect(caughtValue).toEqual([0, 0, 0]);
});

test('onSubmit returns selected values', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" isAnswerMode={false} onSubmit={(submitted) => {
        caughtValue = submitted;
    }} />);
    const firstSelect = component.container.getElementsByTagName('select')[1]
    fireEvent.change(firstSelect, {
        target: {value: firstSelect.getElementsByTagName('option')[1].value}
    });
    fireEvent.click(component.container.getElementsByTagName('button')[0]);
    expect(caughtValue).toEqual([0, 1, 0]);
});

test('in answer mode dropdowns are disabled', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" isAnswerMode={true} onSubmit={(submitted) => {
    }} />);
    const firstSelect = component.container.getElementsByTagName('select')[1]
    expect(firstSelect.disabled).toBeTruthy()
});

test('in answer mode error answer is red and correct answer is green', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" isAnswerMode={false} onSubmit={(submitted) => {}} />);
    const firstSelect = component.container.getElementsByTagName('select')[1]
    fireEvent.change(firstSelect, {
        target: {value: firstSelect.getElementsByTagName('option')[1].value}
    });
    component.rerender(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" isAnswerMode={true} onSubmit={(submitted) => {}} />);
    expect(component.container.getElementsByTagName('select')[0].className).toBe("success")
    expect(firstSelect.className).toBe("error")
});
