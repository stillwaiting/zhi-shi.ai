import React from 'react';
import { fireEvent, render, RenderResult, screen, act } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom'
import { enableFetchMocks } from 'jest-fetch-mock'
import fetchMock from "jest-fetch-mock"

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const createApp = async () => {
    let component : RenderResult | null;
    act(() => {
        component = render(<App />)
    });
    await act(async () => { sleep(10) });
    return component!;
}

describe('App', () => {
    beforeEach(() => {
        enableFetchMocks();
        // https://github.com/jefflau/jest-fetch-mock/issues/184
        fetchMock.resetMocks();
        fetchMock.mockResponse('# default data');
    });

    test('should load data from web', async () => {
        let component = await createApp();
        expect(component.getByText('default data').innerHTML).toBe('default data');
    });

    test('onSubmit should render menu', async () => {
        let component = await createApp();
        fireEvent.change(component.getByTestId('textarea'), { target: { value: '# Hello-testing' } });
        fireEvent.click(component.getByTestId('submit'));
        
        expect(component.getByText('Hello-testing').innerHTML).toBe('Hello-testing');
    });

    test('plus should increase width', async () => {
        let component = await createApp();
        fireEvent.click(component.getByTestId('plus'));
        expect(component.getByTestId('menu-container').style.width).toBe('350px');
    });

    test('minus should decrease width', async () => {
        let component = await createApp();
        fireEvent.click(component!.getByTestId('minus'));
        expect(component.getByTestId('menu-container').style.width).toBe('250px');
    });
});