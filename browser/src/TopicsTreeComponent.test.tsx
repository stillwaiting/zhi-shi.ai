import React from 'react';
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import TopicsTreeComponent from './TopicsTreeComponent';
import '@testing-library/jest-dom'
import { MarkdownNode } from './MarkdownParser';

const WITH_NESTED_CHILDREN = [
    {
        title: 'hello1', 
        body: {content: ''}, 
        path: ['hello1'], 
        children: [
            {
                title: 'hello2', 
                body: {content: ''}, 
                children: [], 
                path: ['hello1', 'hello2'], 
                childrenByTitleIndex: {}
            }
        ], 
        childrenByTitleIndex: {
            'hello2': 0
        }
    },
];

describe('TopicsTreeComponent', () => {
    test('renders empty set of nodes', () => {
        const component = render(<TopicsTreeComponent nodes={[]} currentNodePath={[]} onNodeClicked={() => {}} />);
        expect(component.container.getElementsByTagName('ul')).toHaveLength(0);
    });

    test('renders titles', async () => {
        const component = render(<TopicsTreeComponent 
            nodes={[
                {title: 'hello1', body: {content: ''}, children: [], childrenByTitleIndex: {}, path: ['hello1']},
                {title: 'hello2', body: {content: ''}, children: [], childrenByTitleIndex: {}, path: ['hello1']}
            ]} 
            currentNodePath={[]} 
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
        const component = render(<TopicsTreeComponent nodes={WITH_NESTED_CHILDREN} currentNodePath={[]} onNodeClicked={() => {}} />);
        expect(component.container.getElementsByTagName('ul')).toHaveLength(2);
        expect(component.container.getElementsByTagName('li')).toHaveLength(2);
        const node1 = await component.findByText('hello1');
        const node2 = await component.findByText('hello2');
        expect(node1).toBeInstanceOf(HTMLElement);
        expect(node2).toBeInstanceOf(HTMLElement);
        // TODO: check that node2 is in a nested child
    });

    test('selects the current node', async () => {
        const component = render(<TopicsTreeComponent nodes={WITH_NESTED_CHILDREN} currentNodePath={
            ["hello1", "hello2"]
        } onNodeClicked={() => {}} />);
        expect(component.container.getElementsByTagName('ul')).toHaveLength(2);
        expect(component.container.getElementsByTagName('li')).toHaveLength(2);
        const node1 = await component.findByText('hello1');
        const node2 = await component.findByText('hello2');
        expect(node1.className).toBe('plainNode');
        expect(node2.className).toBe('selectedNode');
    });

    test('passes over the clicked node', async () => {
        let clickedNode: MarkdownNode;
        const component = render(<TopicsTreeComponent nodes={WITH_NESTED_CHILDREN} currentNodePath={
            ["hello1", "hello2"]
        } onNodeClicked={(node) => { clickedNode = node; }} />);
        const node2 = await component.findByText('hello2');
        fireEvent.click(node2);
        expect(clickedNode!.title).toBe("hello2");
    });
});