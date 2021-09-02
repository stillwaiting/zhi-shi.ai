import React from "react";
import { expect } from '@jest/globals';
import { fireEvent, render, RenderResult, screen, cleanup, act } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import TrainerAppComponent from './TrainerAppComponent';

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('TrainerAppComponent', () => {

    beforeEach(() => {
        fetchMock.enableMocks();
        fetchMock.mockResponse(`

# Root

## Rule blah

### Task node 3

Some text that should be ignored.

? 6 (foo|bar)
! hello

? 7 (hello|world)
! cat

        `);
    });

    afterEach(() => {
        fetchMock.disableMocks();
        cleanup();
    });

    test('shows browser warning', async () => {
        const component = render(<TrainerAppComponent url='/foo' />)
        await act(async () => { await sleep(1); });
        expect(component.getByTestId('BrowserWarning')).toBeDefined();
    });


    test('downloads data and then shows the task', async () => {
        const component = render(<TrainerAppComponent url='/foo' />)
        await act(async () => { await sleep(1); });
        if (component.container.innerHTML.indexOf('hello') >= 0) {
            expect(component.getByText('hello')).toBeDefined();
        } else {
            expect(component.getByText('foo')).toBeDefined();
        }
    });
});