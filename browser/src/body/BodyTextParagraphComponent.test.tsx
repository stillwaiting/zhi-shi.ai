import { MarkdownBody } from "../md/types";
import React from 'react';
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import BodyComponent from './BodyComponent';
import parseBody from "../md/MarkdownBodyParser";
import BodyTextParagraphComponent from "./BodyTextParagraphComponent";

describe('BodyTextParagraphComponent', () => {
    test('renders decorations', () => {
        const component = render(<BodyTextParagraphComponent data={{text: "*hello* **world** _foo_ __bar__"}} onLinkClicked={() =>{}} />);
        expect(component.getByText('hello').tagName).toBe('I');
        expect(component.getByText('world').tagName).toBe('B');
        expect(component.getByText('foo').tagName).toBe('I');
        expect(component.getByText('bar').tagName).toBe('B');
    });

    test('renders nested decorations', () => {
        const component = render(<BodyTextParagraphComponent data={{text: "*hello **world***"}} onLinkClicked={() =>{}} />);
        expect(component.container.children[0].innerHTML).toBe('<i>hello <b>world</b></i>');
    });

    test('renders links', () => {
        const text = `
            hello [world](blah/test test""/another one#anchor)
        `
        const component = render(<BodyTextParagraphComponent data={{text: text}} onLinkClicked={() =>{}} />);
        expect(component.getByText('world').outerHTML).toBe('<a href="blah/test test&quot;&quot;/another one#anchor">world</a>');
    });

    test('does not replace in links', () => {
        const text = `
            hello [world](blah/test test""/another one#anchor)
        `
        let link = '';
        const component = render(<BodyTextParagraphComponent data={{text: text}} onLinkClicked={(firedLink) =>{ link = firedLink}} />);
        fireEvent.click(component.getByText('world'));
        expect(link).toBe('blah/test test""/another one#anchor');
    });
});