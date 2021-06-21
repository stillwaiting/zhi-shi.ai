import React from 'react';
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import TopicsTreeComponent from './TopicsTreeComponent';
import '@testing-library/jest-dom'

test('renders empty set of nodes', () => {
    const component = render(<TopicsTreeComponent nodes={[]} />);
    expect(component.container.getElementsByTagName('ul')).toHaveLength(0);
});

test('renders titles', async () => {
    const component = render(<TopicsTreeComponent nodes={[
        {title: 'hello1', body: {content: ''}, children: []},
        {title: 'hello2', body: {content: ''}, children: []}
    ]} />);
    expect(component.container.getElementsByTagName('ul')).toHaveLength(1);
    expect(component.container.getElementsByTagName('li')).toHaveLength(2);
    const child1 = await component.findByText('hello1');
    const child2 = await component.findByText('hello2');
    expect(child1).toBeInstanceOf(HTMLElement);
    expect(child2).toBeInstanceOf(HTMLElement);
});

test('renders nested titles', async () => {
    const component = render(<TopicsTreeComponent nodes={[
        {title: 'hello1', body: {content: ''}, children: [
            {title: 'hello2', body: {content: ''}, children: []}
        ]},
    ]} />);
    expect(component.container.getElementsByTagName('ul')).toHaveLength(2);
    expect(component.container.getElementsByTagName('li')).toHaveLength(2);
    const child1 = await component.findByText('hello1');
    const child2 = await component.findByText('hello2');
    expect(child1).toBeInstanceOf(HTMLElement);
    expect(child2).toBeInstanceOf(HTMLElement);
});