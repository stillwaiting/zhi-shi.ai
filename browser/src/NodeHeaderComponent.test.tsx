import React from 'react';
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import TopicsTreeComponent from './TopicsTreeComponent';
import '@testing-library/jest-dom'
import { MarkdownNode } from './MarkdownParser';
import NodeHeaderComponent from './NodeHeaderComponent';

describe('NodeHeaderComponent', () => {
    test('can render empty path', async () => {
        const component = render(<NodeHeaderComponent path={[]} onPathClicked={() => {}}/>);
        const elts = await component.findAllByTestId('NodeHeaderComponent');
        expect(elts).toHaveLength(1);
    });
    test('can render many paths', async () => {
        const component = render(<NodeHeaderComponent path={['hello', 'world']} onPathClicked={() => {}}/>);
        const helloItem = await component.getByText('hello');
        const worldItem = await component.getByText('world');
        expect(helloItem.innerHTML).toBe('hello');
        expect(worldItem.innerHTML).toBe('world');
    });

    test('can render many paths', async () => {
        let data = [];
        const component = render(<NodeHeaderComponent path={['hello', 'world']} onPathClicked={(clickData) => { 
            data.push(clickData);
         }}/>);
        const helloItem = await component.getByText('hello');
        const worldItem = await component.getByText('world');
        fireEvent.click(helloItem);
        fireEvent.click(worldItem);
        expect(data).toStrictEqual([
            ['hello'],
            ['hello', 'world']
        ]);
    });
});