import { MarkdownBody } from "../md/types";
import React from 'react';
import { fireEvent, render, RenderResult, screen } from '@testing-library/react';
import BodyComponent from './BodyComponent';

describe('BodyComponent', () => {

    test('Can render texts', () => {
        const body: MarkdownBody = {
            content: [{
                text: 'hello',
            }, {
                text: 'world'
            }]
        };

        const component = render(<BodyComponent body = {body} />);
        const helloElt = component.getByText('hello');
        const worldElt = component.getByText('world');
        expect(helloElt).toBeDefined();
        expect(helloElt === worldElt).toBeFalsy();
    });

    test('Can render unordered lists', () => {
        const body: MarkdownBody = {
            content: [{
                start: '-',
                isOrdered: false,
                items: [{
                    content: [{
                        text: 'hello',
                    }]
                }, {
                    content: [{
                        start: '-',
                        isOrdered: false,
                        items: [{
                            content: [{
                                text:'foo'
                            }]
                        }]
                    }]    
                }, {
                    content: [{
                        text: 'world'
                    }]
                }]
            }, {
                text: 'next paragraph'
            }]
        };
        const component = render(<BodyComponent body = {body} />);

        const helloElt = component.getByText('hello');
        const helloLiElt = helloElt.closest('li');
        const secondLiElt = helloLiElt.nextSibling as HTMLElement;
        const thirdLiElt = secondLiElt.nextSibling as HTMLElement;

        expect(secondLiElt.getElementsByTagName('p')[0].innerHTML).toStrictEqual('foo');
        expect(thirdLiElt.getElementsByTagName('p')[0].innerHTML).toStrictEqual('world');
        expect(component.getByText('next paragraph')).toBeDefined();
    });

    test('Can render ordered lists', () => {
        const body: MarkdownBody = {
            content: [{
                start: '1',
                isOrdered: true,
                items: [{
                    content: [{
                        text: 'hello',
                    }]
                }, {
                    content: [{
                        start: '1',
                        isOrdered: true,
                        items: [{
                            content: [{
                                text:'foo'
                            }]
                        }]
                    }]    
                }, {
                    content: [{
                        text: 'world'
                    }]
                }]
            }, {
                text: 'next paragraph'
            }]
        };
        const component = render(<BodyComponent body = {body} />);

        const helloElt = component.getByText('hello');
        const helloLiElt = helloElt.closest('li');
        const secondLiElt = helloLiElt.nextSibling as HTMLElement;
        const thirdLiElt = secondLiElt.nextSibling as HTMLElement;
        
        expect(secondLiElt.getElementsByTagName('p')[0].innerHTML).toStrictEqual('foo');
        expect(thirdLiElt.getElementsByTagName('p')[0].innerHTML).toStrictEqual('world');
        expect(component.getByText('next paragraph')).toBeDefined();
    });
});