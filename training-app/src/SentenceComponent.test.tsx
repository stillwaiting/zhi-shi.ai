import React from 'react';
import { render, screen } from '@testing-library/react';
import SentenceComponent from './SentenceComponent';
import '@testing-library/jest-dom'

test('renders without dropdowns', () => {
    const component =render(<SentenceComponent sentence="Hello, world!" onSubmit={() => {}} />);
    const text = screen.getByText(/Hello, world!/i);
    expect(text).toBeInTheDocument();
    expect(component.container.getElementsByTagName('select')).toHaveLength(0);
});

test('renders with dropdowns', () => {
    const component = render(<SentenceComponent sentence="(Hello|blah|baz), (world|foo)(!|.)" onSubmit={() => {}} />);
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
