import { getNodeText } from '@testing-library/dom';
import React, { useState, useEffect } from 'react';
import './BodyTextParagraphComponent.scss';

import { isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownBodyChunkTextParagraph, MarkdownNode } from '../md/types';

// @ts-ignore
import replaceAllInserter from 'string.prototype.replaceall';
replaceAllInserter.shim();

type BodyTextParagraphComponent = {
    data: MarkdownBodyChunkTextParagraph,
    onLinkClicked: (link: string) => void
};

// Being pragmatic and decided not to parse it completely
function toHtml(text: string, highlightedArea: string): string {
    let htmlText = text.split("**").map((chunk, idx) => {
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


    htmlText = htmlText.replaceAll(/\[(.*?)\]\((.*?)\)/g, '<a href=\'$2\'>$1</a>');

    htmlText = htmlText.replaceAll(
        // [#highlightedArea]blah[/] ====> <span class="highlight active">blah</span>(<a href='#highlightedArea'>highlightedArea</a>)
        new RegExp('\\[#' + highlightedArea + '\\](.*?)\\[\\/\\]', 'g'), 
        '<span class="highlight active">$1</span>(<a href=\'#' + highlightedArea + '\'>' + highlightedArea + '</a>)')
    
    htmlText = htmlText.replaceAll(
        // [#foo]blah[/] ====> <span class="highlight highlight-foo">blah</span>(<a href='#foo'>foo</a>)
        /\[#(.*?)\](.*?)\[\/\]/g, 
        '<span class="highlight highlight-$1">$2</span>(<a href=\'#$1\'>$1</a>)'
    );


    return htmlText;
}

export default ( { data, onLinkClicked }: BodyTextParagraphComponent ) => {
    const [anchor, setAnchor] = useState<string>(window.location.hash);
    const [onHashChangeCallback, setOnHashChangeCallback] = useState<() => void>(() => {
        return () => {
            setAnchor(window.location.hash)
        }
    });


    useEffect(() => {
        if (data.text.indexOf('[#') >= 0) {
            window.addEventListener('hashchange', onHashChangeCallback);
        
            return () => {
            window.removeEventListener('hashchange', onHashChangeCallback);
            }
        }
      }, [])

    return <p 
        className='BodyTextParagraphComponent' 
        dangerouslySetInnerHTML = {{__html: toHtml(data.text, anchor.startsWith('#') ? anchor.substr(1) : anchor)}} 
        onClick={(e: React.MouseEvent<HTMLElement>) => {
            const targetLink = (e.target as HTMLElement).closest('a');
            if(!targetLink) return;
            const href = targetLink.attributes[0].value;
            if (!href.startsWith('#')) {
                e.preventDefault();
                onLinkClicked(targetLink.attributes[0].value); 
            }
        }}
    />;
}



