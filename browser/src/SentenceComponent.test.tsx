import React from 'react';
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import SentenceComponent from './SentenceComponent';
import '@testing-library/jest-dom'

const getDropdowns = (component: RenderResult): HTMLCollectionOf<HTMLSelectElement> => 
    component.container.getElementsByTagName('select');


const getOptions = (dropdown: HTMLSelectElement): HTMLCollectionOf<HTMLOptionElement> =>
    dropdown.getElementsByTagName('option');

const getButton = (component: RenderResult): HTMLButtonElement =>
    component.container.getElementsByTagName('button')[0]

const hasButton = (component: RenderResult): boolean =>
    component.container.getElementsByTagName('button').length > 0

test('renders without dropdowns', () => {
    const component = render(<SentenceComponent sentence="Hello, world!" onSubmit={() => {}} />);
    const text = screen.getByText(/Hello, world!/i);
    expect(text).toBeInTheDocument();
    expect(getDropdowns(component)).toHaveLength(0);
});

test('renders with dropdowns', () => {
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" onSubmit={() => {}} />);
    const dropdowns = getDropdowns(component);
    expect(dropdowns).toHaveLength(3);
    const expected = [
        ['Hello', 'blah', 'baz'],
        ['world', 'foo'],
        ['!', '.']
    ];
    expected.forEach((options, dropdownIdx) => {
       options.forEach((option, optionIdx) => {
            expect(getOptions(dropdowns[dropdownIdx])[optionIdx].innerHTML).toEqual(option);
       });
    });
});

test('onSubmit returns empty array when no dropdowns', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="Hello, world!" onSubmit={(submitted) => {
        caughtValue = submitted;
    }} />);
    fireEvent.click(getButton(component));
    expect(caughtValue).toHaveLength(0);
});

test('onSubmit returns array of zeros when no values were selected', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" onSubmit={(submitted) => {
        caughtValue = submitted;
    }} />);
    fireEvent.click(getButton(component));
    expect(caughtValue).toEqual([0, 0, 0]);
});

test('onSubmit returns selected values', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" onSubmit={(submitted) => {
        caughtValue = submitted;
    }} />);
    const firstSelect = getDropdowns(component)[1]
    fireEvent.change(firstSelect, {
        target: {value: getOptions(firstSelect)[1].value}
    });
    fireEvent.click(getButton(component));
    expect(caughtValue).toEqual([0, 1, 0]);
});

test('in answer mode dropdowns are disabled', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" onSubmit={(submitted) => {}} />);
    fireEvent.click(getButton(component));
    const firstSelect = getDropdowns(component)[1];
    expect(firstSelect.disabled).toBeTruthy()
});

test('in answer mode button disappears', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" onSubmit={(submitted) => {}} />);
    fireEvent.click(getButton(component));
    expect(hasButton(component)).toBeFalsy()
});

test('in answer mode error answer is red and correct answer is green', () => {
    let caughtValue;
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" onSubmit={(submitted) => {}} />);
    const firstSelect = getDropdowns(component)[1]
    fireEvent.change(firstSelect, {
        target: {value: getOptions(firstSelect)[1].value}
    });
    fireEvent.click(getButton(component));
    expect(getDropdowns(component)[0].className).toBe("success")
    expect(getDropdowns(component)[1].className).toBe("error")
});