import fetchMock from 'jest-fetch-mock';
import React from 'react';
import DataProviderComponent from './DataProviderComponent';
import { cleanup, fireEvent, render, RenderResult, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('DataProviderComponent', () => {
    beforeEach(() => {
        fetchMock.enableMocks();
    });

    afterEach(() => {
        fetchMock.disableMocks();
        cleanup();
    });

    test('shows loading while data is being fetched', async () => {
        fetchMock.mockResponse('hello');
        const component = render(<DataProviderComponent url='http://google.com' onDataProvided={() => {}} />);
        expect(component.getByText('Loading...')).toBeDefined();
        await act(async () => { await sleep(1); }); // to avoid warning that the component state was updated without act()
    });

    test('does not render anything when data is fetched', async () => {
        fetchMock.mockResponse('hello');
        const component = render(<DataProviderComponent url='http://google.com' onDataProvided={() => {}} />);
        await act(async () => { await sleep(1); });
        expect(component.queryByText('Loading...')).toBeNull();
    });

    test('returns data in callback when fetched', async () => {
        fetchMock.mockResponse('hello');
        let caughtData: string = '';
        const component = render(<DataProviderComponent url='http://google.com' onDataProvided={(data) => {caughtData = data}} />);
        await act(async () => { await sleep(1); });
        expect(caughtData).toBe('hello');
    });

    test('shows a error when fetch fails', async () => {
        fetchMock.mockReject(new Error('haha'));
        const component = render(<DataProviderComponent url='http://google.com' onDataProvided={(data) => { }} />);
        await act(async () => { await sleep(1); });
        expect(component.getByText('Error: Error: haha')).toBeDefined();
    });

    test('on retry refetches the data', async () => {
        fetchMock.mockReject(new Error('haha'));
        let caughtData: string = '';
        const component = render(<DataProviderComponent url='http://google.com' onDataProvided={(data) => {caughtData = data}} />);
        await act(async () => { await sleep(1); });

        fetchMock.mockResponse('hello');
        fireEvent.click(component.getByText('try again'));
        await act(async () => { await sleep(1); });
        expect(caughtData).toBe('hello');
    });

    test('when cancelled, doesnt invoke callbacks', async () => {
        fetchMock.mockResponse('hello');
        let caughtData: string = '';
        const component = render(<DataProviderComponent url='http://google.com' onDataProvided={(data) => {caughtData = data}} />);
        component.unmount();
        await act(async () => { await sleep(1); });
        expect(caughtData).toBe('');
    }); 
});