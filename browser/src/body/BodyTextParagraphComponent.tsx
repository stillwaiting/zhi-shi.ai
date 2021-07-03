import { getNodeText } from '@testing-library/dom';
import React, { useState, useEffect, useContext } from 'react';
import './BodyTextParagraphComponent.scss';

import { isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownBodyChunkTextParagraph, MarkdownNode } from '../md/types';

import AppContext  from '../AppContext';

// @ts-ignore
import replaceAllInserter from 'string.prototype.replaceall';
replaceAllInserter.shim();

type BodyTextParagraphComponent = {
    data: MarkdownBodyChunkTextParagraph
};

// Being pragmatic and decided not to parse it completely
function toHtml(text: string, anchor: string, selectedText: string): string {
    let htmlText = text;

    if (selectedText.length > 0) {
        htmlText = htmlText.split(selectedText.replaceAll("\n", " ").trim()).join(
            '<span class="selected">' + selectedText + '</span>'
        );
    }
    
    htmlText = htmlText.split("**").map((chunk, idx) => {
        if (idx %2 == 1) {
            return "<b>" + chunk + "</b>";
        }
        return chunk;
    }).join('');

    htmlText = htmlText.split("__").map((chunk, idx) => {
        if (idx %2 == 1) {
            return "<b>" + chunk + "</b>";
        }
        return chunk;
    }).join('');

    htmlText = htmlText.split("_").map((chunk, idx) => {
        if (idx %2 == 1) {
            return "<i>" + chunk + "</i>";
        }
        return chunk;
    }).join('');

    htmlText = htmlText.split("*").map((chunk, idx) => {
        if (idx %2 == 1) {
            return "<i>" + chunk + "</i>";
        }
        return chunk;
    }).join('');


    htmlText = htmlText.replaceAll(/\[(.*?)\]\((.*?)\)/g, (a1, a2, a3, a4) => {
        return '<a href=\'' + a3.split('#').join('|') + '\'>' + a2 + '</a>'
    });

    htmlText = htmlText.replaceAll(
        // [#highlightedArea]blah[/] ====> <span class="highlight active">blah</span>(<a href='#highlightedArea'>highlightedArea</a>)
        new RegExp('\\[#' + anchor + '\\](.*?)\\[\\/\\]', 'g'), 
        '<span class="highlight active">$1</span>(<a href=\'|' + anchor + '\'>' + anchor + '</a>)');
    
    htmlText = htmlText.replaceAll(
        // [#foo]blah[/] ====> <span class="highlight highlight-foo">blah</span>(<a href='#foo'>foo</a>)
        /\[#(.*?)\](.*?)\[\/\]/g, 
        '<span class="highlight highlight-$1">$2</span>(<a href=\'|$1\'>$1</a>)'
    );

    return htmlText;
}

export default ( { data }: BodyTextParagraphComponent ) => {
    const context = useContext(AppContext);
    return <p 
        className='BodyTextParagraphComponent' 
        dangerouslySetInnerHTML = {{__html: toHtml(data.text, context.currentNodeAnchor, context.currentSelectedText)}} 
        onClick={(e: React.MouseEvent<HTMLElement>) => {
            const targetLink = (e.target as HTMLElement).closest('a');
            if(!targetLink) return;
            const href = targetLink.attributes[0].value;
            if (!href.startsWith('#')) {
                e.preventDefault();
                context.onLinkClicked(targetLink.attributes[0].value); 
            }
        }}
    />;
}



