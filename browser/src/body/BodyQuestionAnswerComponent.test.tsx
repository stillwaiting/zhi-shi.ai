import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BodyQuestionAnswerComponent from './BodyQuestionAnswerComponent';
import '@testing-library/jest-dom'
import AppContext from '../AppContext';

describe('BodyQuestionAnswerComponent', () => {
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
    
    test('does not show answers before submit', () => {
        const component = render(<BodyQuestionAnswerComponent  data={{
            question: {text: "(Hello|blah|baz), (world|foo)(!|.)"},
            answers: [{text: "answer 1"}, {text: "answer 2"}]
        }} />);
        expect(component.container.getElementsByClassName('answer').length).toBe(0);
    });

    test('shows answers after submit', () => {
        const component = render(<BodyQuestionAnswerComponent  data={{
            question: {text: "(Hello|blah|baz), (world|foo)"},
            answers: [{text: "answer 1"}, {text: "answer 2"}]
        }}  />);
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

    test('appends answers with referenes from title when provided', () => {
        const component = render(<AppContext.Provider value={{
                currentNodeTitle: 'doit ::to!',
                currentNodeAnchor: '',
                currentSelectedText: '',
                onLinkClicked: (link) => {},
                expandQuestionAnswer: false,
                linkRenderer: (link, text) => { return `<a href="${link.split('"').join('&quot;')}">${text}</a>`; },
            }}>
            <BodyQuestionAnswerComponent  data={{
                question: {text: "(Hello|blah|baz), (world|foo)"},
                answers: [{text: "answer 1"}, {text: "answer 2"}]
            }}  />
        </AppContext.Provider>);
        fireEvent.click(component.container.getElementsByTagName('button')[0]);
        expect(component.getAllByText("Details")).toHaveLength(2);
    });

    test('does not append answer with referenes from title when they already have a link', () => {
        const component = render(<AppContext.Provider value={{
                currentNodeTitle: 'doit ::to!',
                currentNodeAnchor: '',
                currentSelectedText: '',
                onLinkClicked: (link) => {},
                expandQuestionAnswer: false,
                linkRenderer: (link, text) => { return `<a href="${link.split('"').join('&quot;')}">${text}</a>`; },
            }}>
            <BodyQuestionAnswerComponent  data={{
                question: {text: "(Hello|blah|baz), (world|foo)"},
                answers: [{text: "answer 1"}, {text: "answer 2 [link](text)"}]
            }}  />
        </AppContext.Provider>);
        fireEvent.click(component.container.getElementsByTagName('button')[0]);
        expect(component.getAllByText("Details")).toHaveLength(1);
    });

    test('does not append answers when no anchor was provided in title', () => {
        const component = render(<BodyQuestionAnswerComponent  data={{
            question: {text: "(Hello|blah|baz), (world|foo)"},
            answers: [{text: "answer 1"}, {text: "answer 2"}]
        }}  />);
        fireEvent.click(component.container.getElementsByTagName('button')[0]);
        expect(component.container.innerHTML.indexOf('Details')).toBe(-1)
    });

    test('expands answers when context provided', () => {
        const component = render(<AppContext.Provider value={{
                currentNodeTitle: 'doit ::to!',
                currentNodeAnchor: '',
                currentSelectedText: '',
                onLinkClicked: (link) => {},
                expandQuestionAnswer: true,
                linkRenderer: (link, text) => { return `<a href="${link.split('"').join('&quot;')}">${text}</a>`; },
            }}>
            <BodyQuestionAnswerComponent  data={{
                question: {text: "(Hello|blah|baz), (world|foo)"},
                answers: [{text: "answer 1"}, {text: "answer 2 [link](text)"}]
            }}  />
        </AppContext.Provider>);
        expect(component.container.innerHTML).toContain("answer 1");
        expect(component.container.innerHTML).toContain("answer 2");
    });
});