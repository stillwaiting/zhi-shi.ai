import React from 'react';
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import BodyQuestionComponent from './BodyQuestionComponent';
import '@testing-library/jest-dom'
import { mockRandomForEach, resetMockRandom } from 'jest-mock-random';

const getDropdowns = (component: RenderResult): HTMLCollectionOf<HTMLSelectElement> => 
    component.container.getElementsByTagName('select');


const getOptions = (dropdown: HTMLSelectElement): HTMLCollectionOf<HTMLOptionElement> =>
    dropdown.getElementsByTagName('option');

const getButton = (component: RenderResult): HTMLButtonElement =>
    component.container.getElementsByTagName('button')[0]

const hasButton = (component: RenderResult): boolean =>
    component.container.getElementsByTagName('button').length > 0

describe('BodyQuestionComponent', () => {

    // @ts-ignore
    let oldRandom = global.Math.random;

    beforeEach(() => {
        // @ts-ignore
        global.Math.random = () => 0
    });
    
    afterEach(() => {
        // @ts-ignore
        global.Math.random = oldRandom;
    })

    test('renders without dropdowns', () => {
        const component = render(<BodyQuestionComponent question="Hello, world!" onSubmit={() => {}} indices={[]} />);
        const text = screen.getByText(/Hello, world!/i);
        expect(text).toBeInTheDocument();
        expect(getDropdowns(component)).toHaveLength(0);
    });

    test('renders with dropdowns', () => {
        const component = render(<BodyQuestionComponent question="(Hello|blah|baz), (world|foo)(!|.)" onSubmit={() => {}} indices={[]} />);
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
        const component = render(<BodyQuestionComponent question="Hello, world!" onSubmit={(submitted) => {
            caughtValue = submitted;
        }} indices={[]} />);
        fireEvent.click(getButton(component));
        expect(caughtValue).toHaveLength(0);
    });

    test('onSubmit returns array of zeros when no values were selected', () => {
        let caughtValue;
        const component = render(<BodyQuestionComponent question="(Hello|blah|baz), (world|foo)(!|.)" onSubmit={(submitted) => {
            caughtValue = submitted;
        }} indices={[]} />);
        fireEvent.click(getButton(component));
        expect(caughtValue).toEqual([0, 0, 0]);
    });

    test('onSubmit returns selected values', () => {
        let caughtValue;
        const component = render(<BodyQuestionComponent question="(Hello|blah|baz), (world|foo)(!|.)" onSubmit={(submitted) => {
            caughtValue = submitted;
        }} indices={[]} />);
        const firstSelect = getDropdowns(component)[1]
        fireEvent.change(firstSelect, {
            target: {value: getOptions(firstSelect)[1].value}
        });
        fireEvent.click(getButton(component));
        expect(caughtValue).toEqual([0, 1, 0]);
    });

    test('in answer mode dropdowns are disabled', () => {
        const component = render(<BodyQuestionComponent question="(Hello|blah|baz), (world|foo)(!|.)" 
            onSubmit={(submitted) => {}} indices={[0, 0, 0]} />);
        const firstSelect = getDropdowns(component)[1];
        expect(firstSelect.disabled).toBeTruthy()
    });

    test('in answer mode button disappears', () => {
        const component = render(<BodyQuestionComponent question="(Hello|blah|baz), (world|foo)(!|.)" 
            onSubmit={(submitted) => {}} indices={[0, 0, 0]} />);
        expect(hasButton(component)).toBeFalsy()
    });

    test('in answer mode error answer is red and correct answer is green', () => {
        const component = render(<BodyQuestionComponent question="(Hello|blah|baz), (world|foo)(!|.)" 
                onSubmit={(submitted) => {}} indices={[0, 1, 0]} />);
        expect(getDropdowns(component)[0].className).toBe("success")
        expect(getDropdowns(component)[1].className).toBe("error")
    });

    test('in answer mode draws the number near the answer', () => {
        const component = render(<BodyQuestionComponent question="(Hello|blah|baz), (world|foo)(!|.)" 
            onSubmit={(submitted) => {}} indices={[0,1,0]} />);
        expect(component.queryAllByText('(1)')).toHaveLength(1);
        expect(component.queryAllByText('(2)')).toHaveLength(1);
        expect(component.queryAllByText('(3)')).toHaveLength(1);
        expect(component.queryAllByText('(4)')).toHaveLength(0);
    });


    test('in question mode does not draw the number near the answer', () => {
        const component = render(<BodyQuestionComponent question="(Hello|blah|baz), (world|foo)(!|.)" 
            onSubmit={(submitted) => {}} indices={[]} />);
        expect(component.queryAllByText('(1)')).toHaveLength(0);
        expect(component.queryAllByText('(2)')).toHaveLength(0);
        expect(component.queryAllByText('(3)')).toHaveLength(0);
    });

    test('shuffles answers', () => {
        // @ts-ignore
        global.Math.random = oldRandom;
        const valuesOfFirstSelect: { [key:string]: number } = {};
        for (let i =0; i < 100; i++ ) {
            const component = render(<BodyQuestionComponent question="(Hello|blah|baz), (world|foo)(!|.)" 
                onSubmit={(submitted) => {}} indices={[]} />);
            const value = (getDropdowns(component)[0].children[0] as HTMLOptionElement).value;
            valuesOfFirstSelect[value] = 1;
        }
        expect(Object.keys(valuesOfFirstSelect)).toHaveLength(3);
    });

    test('shuffles pre-selected answers', () => {
        // @ts-ignore
        global.Math.random = oldRandom;
        const valuesOfFirstSelect: { [key:string]: number } = {};
        for (let i =0; i < 100; i++ ) {
            const component = render(<BodyQuestionComponent question="(Hello|blah|baz), (world|foo)(!|.)" 
                onSubmit={(submitted) => {}} indices={[]} />);
            const value = getDropdowns(component)[0].value;
            valuesOfFirstSelect[value] = 1;
        }
        expect(Object.keys(valuesOfFirstSelect)).toHaveLength(3);
    });
});