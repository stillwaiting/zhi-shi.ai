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
                onLinkClicked: (link) => { capturedLink = link},
                linkRenderer: (link, text) => { return `<a href="${link.split('"').join('&quot;')}">${text}</a>`; }
            }}>
                <BodyTextParagraphComponent data={{text: text}}   />
            </AppContext.Provider>
        );
        fireEvent.click(component.getByText('world'));
        expect(capturedLink).toBe('blah/test test""/another one#anchor');
    });

    test('does fire events on anchor click', async () => {
        const text = `
            hello <a href='#foobar'>world</a>
        `
        let capturedLink = '';
        const component = render(
            <AppContext.Provider value={{
                currentNodeTitle: '',
                currentNodeAnchor: '',
                currentSelectedText: '',
                onLinkClicked: (link) => { capturedLink = link},
                linkRenderer: (link, text) => { return `<a href="${link.split('"').join('&quot;')}}">${text}</a>`; }
            }}>
                <BodyTextParagraphComponent data={{text: text}}   />
            </AppContext.Provider>
        );
        fireEvent.click(component.getByText('world'));
        expect(capturedLink).toBe('#foobar');
    });

    test('renders highlighted areas', () => {
        const text = `
            hello [#world]foo bar[/]
        `
        const component = render(<BodyTextParagraphComponent data={{text: text}} />);
        expect(component.container.children[0].innerHTML.trim()).toBe(
            "hello <span class=\"highlight highlight-world\">foo bar</span>(<a href=\"#world\">world</a>)");
    });

    test('highlighted areas and links play together well', () => {
        const text = `
            hello [#world]foo bar[/] (link)[#blah]
        `
        const component = render(<BodyTextParagraphComponent data={{text: text}} />);
        expect(component.container.children[0].innerHTML.trim()).toBe(
            "hello <span class=\"highlight highlight-world\">foo bar</span>(<a href=\"#world\">world</a>) (link)[#blah]");
    });

    test('renders double-line', () => {
        const text = `
            hello <d>foo bar</d>
        `
        const component = render(<BodyTextParagraphComponent data={{text: text}} />);
        expect(component.container.children[0].innerHTML.trim()).toBe(
            "hello <span class=\"doubleline\">foo bar</span>");
    });

    test('renders ending', () => {
        const text = `
            hello <ending>foo bar</ending>
        `
        const component = render(<BodyTextParagraphComponent data={{text: text}} />);
        expect(component.container.children[0].innerHTML.trim()).toBe(
            "hello <span class=\"ending\">foo bar</span>");
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
                onLinkClicked: (link) => {},
                linkRenderer: (link, text) => { return `<a href="${link.split('"').join('&quot;')}">${text}</a>`; }
            }}>
                <BodyTextParagraphComponent data={{text: text}} />
            </AppContext.Provider>
        );
        expect(component.container.children[0].innerHTML.trim()).toBe(
            "hello <span class=\"highlight active\">foo bar</span>(<a href=\"#doit\">doit</a>)");
    });

    test('selects text', () => {
        const text = 'hello world hello world';
        const component = render(
            <AppContext.Provider value={{
                currentNodeTitle: '',
                currentNodeAnchor: '',
                currentSelectedText: 'world',
                onLinkClicked: (link) => {},
                linkRenderer: (link, text) => { return `<a href="${link.split('"').join('&quot;')}}">${text}</a>`; }
            }}>
                <BodyTextParagraphComponent data={{text: text}} />
            </AppContext.Provider>
        );
        expect(component.container.children[0].innerHTML.trim()).toBe(
            "hello <span class=\"selected\">world</span> hello <span class=\"selected\">world</span>");
    })
    
});