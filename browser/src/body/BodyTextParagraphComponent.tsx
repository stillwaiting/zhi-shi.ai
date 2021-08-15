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

const supportedTagsReplacement = ['dashed', 'ddashed', 'wave', 'prefix', 'suffix', 'ending', 'root', 'nowrap'].map(tag => {
    const regexp = new RegExp(`\\<${tag}\\>(.*?)\\<\\/${tag}\\>`, "g");
    
    return (str: string) => str.replaceAll(regexp, `<span class="${tag}">$1</span>`);
});


// Being pragmatic and decided not to parse it completely
function toHtml(text: string, selectedAnchor: string, selectedText: string, linkRenderer: (link: string, text:string) => string): string {
    let htmlText = text;

    // Extract all links before substution to avoid corrupting the links
    let links: { [key: string] : string} = {};
    htmlText = htmlText.replaceAll(/\[([^\]]*?)\]\((.*?)\)/g, (a1, a2, a3, a4) => {
        const key = "" + Math.random() + "" + new Date().getTime();
        links[key] = linkRenderer(a3, a2);
        return key;
    });

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

    htmlText = htmlText.replaceAll(
        // [#highlightedArea]blah[/] ====> <span class="highlight active">blah</span>(<a href='#highlightedArea'>highlightedArea</a>)
        new RegExp('\\[#' + selectedAnchor + '\\](.*?)\\[\\/\\]', 'g'), 
        (a1, a2, a3, a4) => {
            return '<span class="highlight active">' + a2 + '</span>(' + linkRenderer('#' + selectedAnchor, selectedAnchor) + ')'
        }
    );
    
    htmlText = htmlText.replaceAll(
        // [#foo]blah[/] ====> <span class="highlight highlight-foo">blah</span>(<a href='#foo'>foo</a>)
        /\[#([^\]]*?)\](.*?)\[\/\]/g, 
        (a1, a2, a3, a4) => {
            return '<span class="highlight highlight-' + a2 + '">' + a3 + '</span>(' + linkRenderer('#' + a2, a2) + ')'
        }
    );

    htmlText = htmlText.replaceAll("\\{", "{").replaceAll("\\}", "}");

    htmlText = htmlText.replaceAll(
        /\{(.*)\}/g,
        (a1, a2, a3, a4) => {
            return '<span class="var">' + a1 + '</span>';
        }
    )

    htmlText = htmlText.replaceAll(
        /\<d\>(.*?)\<\/d\>/g,
        '<span class="doubleline">$1</span>'
    );

    supportedTagsReplacement.forEach(replacer => {
        htmlText = replacer(htmlText);
    });

    Object.keys(links).forEach(linkKey => {
        htmlText = htmlText.replace(linkKey, links[linkKey]);
    });

    return htmlText;
}

function selectSpan(element: HTMLElement) {
    const selection = window.getSelection();        
    const range = document.createRange();
    range.selectNodeContents(element);
    selection!.removeAllRanges();
    selection!.addRange(range);
}

export default ( { data }: BodyTextParagraphComponent ) => {
    const context = useContext(AppContext);
    return <p 
        className='BodyTextParagraphComponent' 
        dangerouslySetInnerHTML = {{__html: toHtml(data.text, context.currentNodeAnchor, context.currentSelectedText, context.linkRenderer)}} 
        onClick={(e: React.MouseEvent<HTMLElement>) => {
            const targetLink = (e.target as HTMLElement).closest('a');
            const targetSpan = (e.target as HTMLElement).closest('span');
            if (targetLink) {
                const href = targetLink.attributes[0].value;
                context.onLinkClicked(href, e); 
            } else if (targetSpan && targetSpan.className == 'var') {
                selectSpan(targetSpan);
                e.preventDefault();
            }
        }}
    />;
}



