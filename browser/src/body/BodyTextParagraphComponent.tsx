import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';
import './BodyTextParagraphComponent.scss';

import { isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownBodyChunkTextParagraph, MarkdownNode } from '../md/types';

type BodyTextParagraphComponent = {
    data: MarkdownBodyChunkTextParagraph
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


    return htmlText;
}

export default ( { data }: BodyTextParagraphComponent ) => {
    return <p className='BodyTextParagraphComponent' dangerouslySetInnerHTML = {{__html: toHtml(data.text)}} />;
}



