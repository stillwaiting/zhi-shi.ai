import { MarkdownBody } from "../md/types";
import React from 'react';
import { fireEvent, render, RenderResult, screen, act } from '@testing-library/react';
import BodyComponent from './BodyComponent';
import parseBody from "../md/MarkdownBodyParser";
import BodyTextParagraphComponent from "./BodyTextParagraphComponent";

import AppContext from '../AppContext';

describe('BodyTextParagraphComponent', () => {

    test('renders decorations', () => {
        const component = render(<BodyTextParagraphComponent data={{text: "*hello* **world** _foo_ __bar__"}}  />);
        expect(component.getByText('hello').tagName).toBe('I');
        expect(component.getByText('world').tagName).toBe('B');
        expect(component.getByText('foo').tagName).toBe('I');
        expect(component.getByText('bar').tagName).toBe('B');
    });

    test('renders nested decorations', () => {
        const component = render(<BodyTextParagraphComponent data={{text: "*hello **world***"}}  />);
        expect(component.container.children[0].innerHTML).toBe('<i>hello <b>world</b></i>');
    });

    test('renders links and fires events on link click', () => {
        const text = `
            hello [world](blah/test test""/another one#anchor)
        `
        let capturedLink = '';
        const component = render(
            <AppContext.Provider value={{
                currentNodeTitle: '',
                currentNodeAnchor: '',
                currentSelectedText: '',
                onLinkClicked: (link) => { capturedLink = link}
            }}>
                <BodyTextParagraphComponent data={{text: text}}   />
            </AppContext.Provider>
        );
        fireEvent.click(component.getByText('world'));
        expect(capturedLink).toBe('blah/test test""/another one|anchor');
    });

    test('does not fire events on anchor click', async () => {
        const text = `
            hello <a href='#foobar'>world</a>
        `
        let link = '';
        const component = render(<BodyTextParagraphComponent data={{text: text}} />);''
        fireEvent.click(component.getByText('world'));

        // This is to make sure that the has was propagated to window.location; otherwise other tests might start failing randomly
        await act(() => 
            new Promise(resolve => setTimeout(() => {
                resolve();
            }, 0))
        );
        
        expect(link).toBe('');
    });

    test('renders highlighted areas', () => {
        const text = `
            hello [#world]foo bar[/]
        `
        const component = render(<BodyTextParagraphComponent data={{text: text}} />);
        expect(component.container.children[0].innerHTML.trim()).toBe("hello <span class=\"highlight highlight-world\">foo bar</span>(<a href=\"|world\">world</a>)");
    });

    test('highlights highlighted areas', () => {
        const text = `
            hello [#doit]foo bar[/]
        `
        const component = render(
            <AppContext.Provider value={{
                currentNodeTitle: '',
                currentNodeAnchor: 'doit',
                currentSelectedText: '',
                onLinkClicked: (link) => {}
            }}>
                <BodyTextParagraphComponent data={{text: text}} />
            </AppContext.Provider>
        );
        expect(component.container.children[0].innerHTML.trim()).toBe("hello <span class=\"highlight active\">foo bar</span>(<a href=\"|doit\">doit</a>)");
    });

    test('selects text', () => {
        const text = 'hello world hello world';
        const component = render(
            <AppContext.Provider value={{
                currentNodeTitle: '',
                currentNodeAnchor: '',
                currentSelectedText: 'world',
                onLinkClicked: (link) => {}
            }}>
                <BodyTextParagraphComponent data={{text: text}} />
            </AppContext.Provider>
        );
        expect(component.container.children[0].innerHTML.trim()).toBe("hello <span class=\"selected\">world</span> hello <span class=\"selected\">world</span>");
    })
    
});