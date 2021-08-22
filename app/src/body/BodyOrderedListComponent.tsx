import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';
import './BodyOrderedListComponent.scss';
import BodyComponent from './BodyComponent';

import { isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownBodyChunkList, MarkdownBodyChunkTextParagraph, MarkdownNode } from '../md/types';

type BodyOrderedListComponent = {
    data: MarkdownBodyChunkList
};

export default ( { data }: BodyOrderedListComponent ) => {
    return <ol start={parseInt(data.start)}>
        {data.items.map((item, itemIdx) => 
            <li key={`li${itemIdx}`}><BodyComponent body={item} /></li>
        )}
    </ol>;
}



