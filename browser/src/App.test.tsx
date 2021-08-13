import React from 'react';
import { fireEvent, render, RenderResult, screen, act, cleanup } from '@testing-library/react';
import App from './App';
import { mocked } from 'ts-jest/utils';
import '@testing-library/jest-dom'
import * as reactDom from 'react-router-dom';
import copy from 'copy-to-clipboard';

jest.mock('react-router-dom', () => {
    const history = {
        push: jest.fn(),
    };
    return {
        useHistory: () => history,
        useLocation: jest.fn()
    };
});

jest.mock('copy-to-clipboard');

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
    
    fireEvent.change(component!.getByTestId('textarea'), { target: { value: 
        '# default data'
    }});
    fireEvent.click(component!.getByTestId('submit'));

    return component!;
}

describe('App', () => {
    beforeEach(async () => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/'
        });
        await digestEvents()
        jest.useFakeTimers();
    });

    afterEach(() => {
        cleanup();
        jest.useRealTimers();
        (reactDom.useHistory().push as jest.Mock).mockReset();
        (reactDom.useLocation as jest.Mock).mockReset();
        delete window.externalText;
        delete window.externalNodeLine;
        delete window.externalNodeTitle;
        delete window.externalSelectedText;
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
        fireEvent.click(component.getByTestId('submit'));

        const lookupNodes = component.getAllByText(/.*blah content.*/).filter(item => item.tagName != 'TEXTAREA');
        expect(lookupNodes).toHaveLength(1);
    });

    test('redirects on NodeHeader clicks', async() => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/another one'
        });
        let component = await createApp();
        fireEvent.change(component.getByTestId('textarea'), { target: { value: '# Hello/testing\nblah content \n## another one\n' } });

        fireEvent.click(component.getByTestId('submit'));

        const lookupNodes = (component.getAllByTestId('NodeHeaderComponent'))[0];
        fireEvent.click(lookupNodes.children[0].children[1]);

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
        fireEvent.click(component.getByTestId('submit'));
        fireEvent.click(component.getByText('boom'));

        expect((mocked(reactDom.useHistory().push).mock.calls[0][0])).toBe("/Hello%2Ftesting");
    });

    test('does not redirect on http links', async() => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/another one'
        });
        let component = await createApp();
        fireEvent.change(component.getByTestId('textarea'), { target: { value: `
# Hello/testing

blah content

## another one

[boom](http://google.com)

` } });
        fireEvent.click(component.getByTestId('submit'));
        fireEvent.click(component.getByText('boom'));

        expect((mocked(reactDom.useHistory().push).mock.calls.length)).toBe(0);
    });

    test('renders copy button for http links and does not redirect', async() => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/another one'
        });
        let component = await createApp();
        fireEvent.change(component.getByTestId('textarea'), { target: { value: `
# Hello/testing

blah content

## another one

[boom](http://google.com)

` } });
        fireEvent.click(component.getByTestId('submit'));
        fireEvent.click(component.getByText('copy'));

        expect((mocked(copy).mock.calls[0][0])).toBe("http://google.com");
        expect((mocked(reactDom.useHistory().push).mock.calls.length)).toBe(0);
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

        expect((mocked(reactDom.useHistory().push).mock.calls[0][0])).toBe("/Hello%2Ftesting|separator|hehe");
    });

    test('supports window.externalText', async () => {
        let component = await createApp();
        window.externalText = '# this is external header';
        act(() => { jest.advanceTimersByTime(1500)} );
        expect(component.getByText('this is external header').innerHTML).toBe('this is external header');
    
    });

    test('removes comments', async () => {
        let component = await createApp();
        window.externalText = '# this is external /* header\n blahblah */';
        act(() => { jest.advanceTimersByTime(1500)} );
        expect(component.getByText('this is external').innerHTML).toBe('this is external');
    
    });

    test('window.externalText does not override new text', async () => {
        let component = await createApp();
        window.externalText = '# this is external header';
        act(() => {  jest.advanceTimersByTime(1500); });

        fireEvent.change(component.getByTestId('textarea'), { target: { value: `
        # blah content        
        ` } });
        fireEvent.click(component.getByTestId('submit'));
        act(() => { jest.advanceTimersByTime(1500)} );

        expect(component.getByText('blah content').innerHTML).toBe('blah content');
    });

    test('supports window.externalNodeLine and  window.externalNodeTitle', async () => {
        let component = await createApp();

        window.externalText = '# hello2\n\nblah\n\nworld';
        act(() => { jest.advanceTimersByTime(1500)} );

        window.externalNodeTitle = 'hello2';
        window.externalNodeLine = 0;
        act(() => { jest.advanceTimersByTime(1500)} );

        expect((mocked(reactDom.useHistory().push).mock.calls[0][0])).toBe("/hello2");
    });

    test('supports externalSelectedText', async () => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/hello2'
        });
        let component = await createApp();

        window.externalText = '# hello2\n\nblah\n\nworld';
        act(() => { jest.advanceTimersByTime(1500)} );

        window.externalSelectedText = 'lah';
        act(() => { jest.advanceTimersByTime(1500)} );

        expect(component.getByText('lah').classList).toContain("selected");
    });

    test('supports window.externalNodeLine and window.externalNodeTitle should not break navigation', async () => {
        let component = await createApp();

        window.externalText = '# hello3\n\nblah\n\n# world1';
        act(() => { jest.advanceTimersByTime(1500)} );

        window.externalNodeTitle = 'hello3';
        window.externalNodeLine = 0;
        act(() => { jest.advanceTimersByTime(1500)} );

        fireEvent.click(component.getByText('world1'));
        act(() => { jest.advanceTimersByTime(1500)} );
        
        expect((mocked(reactDom.useHistory().push).mock.calls)).toHaveLength(2);
    });

    test('supports window.externalNodeLine and window.externalNodeTitle should refocus on same node when line changes', async () => {
        let component = await createApp();

        window.externalText = '# hello4\n\nblah\n\n# world4';
        act(() => { jest.advanceTimersByTime(1500)} );

        window.externalNodeTitle = 'hello4';
        window.externalNodeLine = 1;
        act(() => { jest.advanceTimersByTime(1500)} );

        fireEvent.click(component.getByText('world4'));
        act(() => { jest.advanceTimersByTime(1500)} );

        window.externalNodeLine = 0;
        act(() => { jest.advanceTimersByTime(1500)} );
        
        expect((mocked(reactDom.useHistory().push).mock.calls)).toHaveLength(3);
        expect((mocked(reactDom.useHistory().push).mock.calls[2][0])).toBe("/hello4");
    });

    test('validates nodes with the same title', async () => {
        let component = await createApp();

        window.externalText = `

# hello

# hello

## world
        `;
        act(() => { jest.advanceTimersByTime(1500)} );

        expect(component.getByText('hello has 2 nodes!')).toBeDefined();
        expect(component.getAllByTestId('error')).toHaveLength(1);
    });

    test('marks invalid links as invalid', async () => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/world'
        });
        let component = await createApp();

        window.externalText = `

# hello

# hello

## world
[blah](blah)

        `;
        act(() => { jest.advanceTimersByTime(1500)} );

        expect(component.container.innerHTML).toContain('invalid link!');
    });

    test('does not mark valid links as invalid', async () => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/world'
        });
        let component = await createApp();

        window.externalText = `

# hello

# blah

# hello

## world
[blah](blah)

        `;
        act(() => { jest.advanceTimersByTime(1500)} );

        expect(component.container.innerHTML).not.toContain('invalid link!');
    });


    test('can find full links', async () => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/world'
        });
        let component = await createApp();

        window.externalText = `

# hello

[#frag]fragment[/]

# blah


## world
[blah](hello#frag)

        `;
        act(() => { jest.advanceTimersByTime(1500)} );

        expect(component.container.innerHTML).not.toContain('invalid link!');
    });

    test('can find fragments in table', async () => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/world'
        });
        let component = await createApp();

        window.externalText = `

# hello

|foo | [#frag]fragment[/] |
---
| blah |

# blah


## world
[blah](hello#frag)

        `;
        act(() => { jest.advanceTimersByTime(1500)} );

        expect(component.container.innerHTML).not.toContain('invalid link!');
    });

    test('by default renders collapsed answers', async () => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/world'
        });
        let component = await createApp();

        window.externalText = `
## world

? (1|2)
! the answer
        `;
        act(() => { jest.advanceTimersByTime(1500)} );

        expect(component.container.innerHTML).not.toContain('the answer');
    });

    test('expands answers when "expand answers" is checked', async () => {
        (reactDom.useLocation as jest.Mock).mockReturnValue({
            pathname: '/world'
        });
        let component = await createApp();

        window.externalText = `
## world

? (1|2)
! the answer
        `;
        act(() => { jest.advanceTimersByTime(1500)} );

        fireEvent.click(component.getByTestId('expandAnswers'));

        expect(component.container.innerHTML).toContain('the answer');
    });


});