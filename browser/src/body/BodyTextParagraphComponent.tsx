import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';
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
function toHtml(text: string): string {
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

    return htmlText;
}

export default ( { data, onLinkClicked }: BodyTextParagraphComponent ) => {
    return <p 
        className='BodyTextParagraphComponent' 
        dangerouslySetInnerHTML = {{__html: toHtml(data.text)}} 
        onClick={(e: React.MouseEvent<HTMLElement>) => {
            const targetLink = (e.target as HTMLElement).closest('a');
            if(!targetLink) return;
            e.preventDefault();
            
            onLinkClicked(targetLink.attributes[0].value); 
        }}
    />;
}



