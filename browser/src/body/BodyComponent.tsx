import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';
import './BodyComponent.scss';

import { isMarkdownBodyChunkList, isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownNode } from '../md/types';
import BodyTextParagraphComponent from './BodyTextParagraphComponent';
import BodyOrderedListComponent from './BodyOrderedListComponent';
import BodyUnorderedListComponent from './BodyUnorderedListComponent';

type BodyComponent = {
    body: MarkdownBody
};

export default ( { body }: BodyComponent ) => {
    return <div className='BodyComponent'>
        {body.content.map((chunk, contentIdx) => {
            if (isMarkdownBodyChunkTextParagraph(chunk)) {
                return <BodyTextParagraphComponent data = {chunk} key={`content${contentIdx}`} />
            } else if (isMarkdownBodyChunkList(chunk)) {
                if (chunk.isOrdered) {
                    return <BodyOrderedListComponent data = {chunk} key={`content${contentIdx}`} />
                } else {
                    return <BodyUnorderedListComponent data = {chunk} key={`content${contentIdx}`} />
                }
            }
        })}
    </div>;
}



