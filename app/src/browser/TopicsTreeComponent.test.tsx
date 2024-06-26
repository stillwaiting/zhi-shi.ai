import React from 'react';
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import TopicsTreeComponent from './TopicsTreeComponent';
import '@testing-library/jest-dom'
import { MarkdownNode } from './../md/types';
import { Context }  from './../body/BodyQuestionAnswerComponent';
import parse from './../md/MarkdownParser';

const WITH_NESTED_CHILDREN = [
    {
        title: 'hello1', 
        body: {content: [{'text':''}]}, 
        path: ['hello1'], 
        children: [
            {
                title: 'hello2', 
                body: {content: [{'text':''}]}, 
                children: [], 
                path: ['hello1', 'hello2'], 
                childrenByTitleIndex: {},
                nodeTemplateVariables: {}
            },
            {
                title: 'hello3 [debug]', 
                body: {content: [{'text':''}]}, 
                children: [], 
                path: ['hello1', 'hello2'], 
                childrenByTitleIndex: {},
                nodeTemplateVariables: {}
            }
        ], 
        childrenByTitleIndex: {
            'hello2': 0
        },
        nodeTemplateVariables: {}
    },
];

/// TODO: add tests for expanding/collapsing
describe('TopicsTreeComponent', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    test('renders empty set of nodes', () => {
        const component = render(<TopicsTreeComponent nodes={[]} onNodeClicked={() => {}} />);
        expect(component.container.getElementsByTagName('ul')).toHaveLength(0);
    });

    test('renders titles', async () => {
        const component = render(<TopicsTreeComponent 
            nodes={[
                {title: 'hello1', body: {content: [{text: ''}]}, children: [], childrenByTitleIndex: {}, path: ['hello1'], nodeTemplateVariables: {}},
                {title: 'hello2', body: {content: [{text: ''}]}, children: [], childrenByTitleIndex: {}, path: ['hello1'], nodeTemplateVariables: {}}
            ]} 
            onNodeClicked={() => {}} 
        />);

        expect(component.container.getElementsByTagName('ul')).toHaveLength(1);
        expect(component.container.getElementsByTagName('li')).toHaveLength(2);
        const child1 = await component.findByText('hello1');
        const child2 = await component.findByText('hello2');
        expect(child1).toBeInstanceOf(HTMLElement);
        expect(child2).toBeInstanceOf(HTMLElement);
    });

    test('renders nested titles', async () => {
        const component = render(<TopicsTreeComponent nodes={WITH_NESTED_CHILDREN} onNodeClicked={() => {}} />);
        fireEvent.click(component.container.getElementsByTagName('a')[0]);
        expect(component.container.getElementsByTagName('ul')).toHaveLength(2);
        expect(component.container.getElementsByTagName('li')).toHaveLength(3);
        const node1 = await component.findByText('hello1');
        const node2 = await component.findByText('hello2');
        const node3 = await component.findByText('hello3 [debug]');
        expect(node1).toBeInstanceOf(HTMLElement);
        expect(node2).toBeInstanceOf(HTMLElement);
        expect(node3).toBeInstanceOf(HTMLElement);
        // @ts-ignore
        expect(component.getByText('hello2').parentNode.parentNode.parentNode.children[1].innerHTML).toBe('hello1')
    });

    test('selects the current node', async () => {
        const component = render(
            <Context.Provider value={{
                currentNodeTitle: 'hello2',
                expandQuestionAnswer: false,
                submitLabel: 'submit',
                correctLabel: 'correct',
            }}>
                <TopicsTreeComponent nodes={WITH_NESTED_CHILDREN} onNodeClicked={() => {}} />
            </Context.Provider>
        
        );
        const node1 = component.getByText('hello1');
        const node2 = component.getByText('hello2');
        expect(node1.className).toBe('plainNode ');
        expect(node2.className).toBe('selectedNode ');
    });

    test('highlights node', async () => {
        const component = render(
            <Context.Provider value={{
                currentNodeTitle: 'hello2',
                expandQuestionAnswer: false,
                submitLabel: 'submit',
                correctLabel: 'correct',
            }}>
                <TopicsTreeComponent nodes={WITH_NESTED_CHILDREN} onNodeClicked={() => {}} />
            </Context.Provider>
        
        );
        const node3 = component.getByText('hello3 [debug]');
        expect(node3.className).toBe('plainNode debugHl');
    });

    test('passes over the clicked node', async () => {
        let clickedNode: MarkdownNode;
        const component = render(<TopicsTreeComponent nodes={WITH_NESTED_CHILDREN} onNodeClicked={(node) => { clickedNode = node; }} />);
        fireEvent.click(component.getByText('++'));
        const node2 = component.getByText('hello2');
        fireEvent.click(node2);
        expect(clickedNode!.title).toBe("hello2");
    });

    test('renders number of tasks', () => {
        const nodes = parse(
`
# hello

## Task

? (apple|banana)
! apple

# Task another

`, []
        )
        const component = render(<TopicsTreeComponent nodes={nodes.parsedNodes} onNodeClicked={() => {}} />);
        fireEvent.click(component.getByText('++'));
        expect(component.getByText('Task (1)')).toBeDefined();
        expect(component.getByText('Task another (0)')).toBeDefined();
    });
});