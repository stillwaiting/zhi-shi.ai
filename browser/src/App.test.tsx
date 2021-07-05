import React from 'react';
import { fireEvent, render, RenderResult, screen, act } from '@testing-library/react';
import App from './App';
import { mocked } from 'ts-jest/utils';
import '@testing-library/jest-dom'
import * as reactDom from 'react-router-dom';

jest.mock('react-router-dom', () => {
    const history = {
        push: jest.fn(),
    };
    return {
        useHistory: () => history,
        useLocation: jest.fn()
    };
});

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const digestEvents = async () => {
    return await act(async () => { sleep(0) });
}

const createApp = async () => {
    let component : RenderResult | null;
    act(() => {
        component = render(<App />)
    });
    
    await digestEvents();

    act(() => {
        fireEvent.change(component!.getByTestId('textarea'), { target: { value: 
            '# default data'
        }});
    });
    await digestEvents();
    act(() => {
        fireEvent.click(component!.getByTestId('submit'));
    });
    await digestEvents();

    return component!;
}

describe('App', () => {
    beforeEach(() => {
        (reactDom.useHistory().push as jest.Mock).mockReset();
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/'
        });
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

    test('on title click should rote user to the node', async () => {
        let component = await createApp();
        fireEvent.click(component!.getByText('default data'));
        expect(reactDom.useHistory().push).toBeCalled();
        expect((mocked(reactDom.useHistory().push).mock.calls[0][0])).toBe("/default%20data");
    });

    test('location should be parsed and node must be selected', async () => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/another one'
        });
        let component = await createApp();
        fireEvent.change(component.getByTestId('textarea'), { target: { value: '# Hello/testing\n ## another one' } });
        fireEvent.click(component.getByTestId('submit'));

        const lookupNodes = await component.findAllByText('another one');
        expect(lookupNodes.find(item => item.className === 'selectedNode')).toBeTruthy();
    });

    test('renders content of a top-level node', async() => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/Hello%2Ftesting'
        });
        let component = await createApp();
        fireEvent.change(component.getByTestId('textarea'), { target: { value: '# Hello/testing\nblah content\n ## another one' } });
        fireEvent.click(component.getByTestId('submit'));

        const lookupNodes = (await component.findAllByText(/.*blah content.*/)).filter(item => item.tagName != 'TEXTAREA');
        expect(lookupNodes).toHaveLength(1);
    });

    test('renders content of a child node', async () => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/yet another one'
        });
        let component = await createApp();
        fireEvent.change(component.getByTestId('textarea'), { target: { value: 
                '# Hello/testing\n ' +
                '## another one \n'+
                'foo bar \n' +
                '## yet another one\n' +
                'blah content\n'
        }});
        await digestEvents();
        fireEvent.click(component.getByTestId('submit'));
        await digestEvents();

        const lookupNodes = component.getAllByText(/.*blah content.*/).filter(item => item.tagName != 'TEXTAREA');
        expect(lookupNodes).toHaveLength(1);
    });

    test('redirects on NodeHeader clicks', async() => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/another one'
        });
        let component = await createApp();
        fireEvent.change(component.getByTestId('textarea'), { target: { value: '# Hello/testing\nblah content \n## another one\n' } });

        await digestEvents();
        fireEvent.click(component.getByTestId('submit'));

        const lookupNodes = (component.getAllByTestId('NodeHeaderComponent'))[0];
        fireEvent.click(lookupNodes.children[0].children[1]);

        await digestEvents();

        expect((mocked(reactDom.useHistory().push).mock.calls[0][0])).toBe("/Hello%2Ftesting");
    });

    test('redirects on body link clicks', async() => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/another one'
        });
        let component = await createApp();
        fireEvent.change(component.getByTestId('textarea'), { target: { value: `
# Hello/testing

blah content

## another one

[boom](Hello/testing)

` } });
        await digestEvents();
        fireEvent.click(component.getByTestId('submit'));

        await digestEvents();
        fireEvent.click(component.getByText('boom'));

        await digestEvents();

        expect((mocked(reactDom.useHistory().push).mock.calls[0][0])).toBe("/Hello%2Ftesting");
    });

    test('supports link traversal', async() => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/another one'
        });
        let component = await createApp();
        fireEvent.change(component.getByTestId('textarea'), { target: { value: `
# Hello/testing

blah content

## another one

[boom](..#hehe)

` } });
        fireEvent.click(component.getByTestId('submit'));

        fireEvent.click(component.getByText('boom'));

        expect((mocked(reactDom.useHistory().push).mock.calls[0][0])).toBe("/Hello%2Ftesting|hehe");
    });
});