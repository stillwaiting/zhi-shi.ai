import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';
import './BodyTextParagraphComponent.scss';

import { isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownBodyChunkTextParagraph, MarkdownNode } from '../md/types';

type BodyTextParagraphComponent = {
    data: MarkdownBodyChunkTextParagraph
};

export default ( { data }: BodyTextParagraphComponent ) => {
    return <p className='BodyTextParagraphComponent'>
        {data.text.length > 0 ? data.text : 'Empty'}
    </p>;
}



