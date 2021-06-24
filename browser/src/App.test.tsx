import React from 'react';
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom'


test('onSubmit should render menu', () => {
    const component = render(<App />);
    fireEvent.change(component.getByTestId('textarea'), { target: { value: '# Hello-testing' } });
    fireEvent.click(component.getByTestId('submit'));
    
    expect(component.getByText('Hello-testing').innerHTML).toBe('Hello-testing');
});

test('plus should increase width', () => {
    const component = render(<App />);
    fireEvent.click(component.getByTestId('plus'));
    expect(component.getByTestId('menu-container').style.width).toBe('350px');
});

test('minus should decrease width', () => {
    const component = render(<App />);
    fireEvent.click(component.getByTestId('minus'));
    expect(component.getByTestId('menu-container').style.width).toBe('250px');
});