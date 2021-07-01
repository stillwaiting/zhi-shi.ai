import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';
import './BodyComponent.scss';

import { isMarkdownBodyChunkList, isMarkdownBodyChunkQuestionAnswers, isMarkdownBodyChunkTable, isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownNode } from '../md/types';
import BodyTextParagraphComponent from './BodyTextParagraphComponent';
import BodyOrderedListComponent from './BodyOrderedListComponent';
import BodyTableComponent from './BodyTableComponent';
import BodyUnorderedListComponent from './BodyUnorderedListComponent';
import BodyQuestionAnswerComponent from './BodyQuestionAnswerComponent';

type BodyComponent = {
    body: MarkdownBody,
    onLinkClicked: (link: string) => void
};

export default ( { body, onLinkClicked }: BodyComponent ) => {
    return <div className='BodyComponent'>
        {body.content.map((chunk, contentIdx) => {
            if (isMarkdownBodyChunkTextParagraph(chunk)) {
                return <BodyTextParagraphComponent data = {chunk} key={`content${contentIdx}`} onLinkClicked={onLinkClicked} />
            } else if (isMarkdownBodyChunkList(chunk)) {
                if (chunk.isOrdered) {
                    return <BodyOrderedListComponent data = {chunk} key={`content${contentIdx}`} onLinkClicked={onLinkClicked} />
                } else {
                    return <BodyUnorderedListComponent data = {chunk} key={`content${contentIdx}`} onLinkClicked={onLinkClicked} />
                }
            } else if (isMarkdownBodyChunkTable(chunk)) {
                return <BodyTableComponent data={chunk} key={`content${contentIdx}`} onLinkClicked={onLinkClicked} />
            } else if (isMarkdownBodyChunkQuestionAnswers(chunk)) {
                return <BodyQuestionAnswerComponent data={chunk} key={`content${contentIdx}`} onLinkClicked={onLinkClicked} />
            }
        })}
    </div>;
}



