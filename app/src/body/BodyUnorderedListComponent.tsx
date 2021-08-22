import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';
import './BodyUnorderedListComponent.scss';
import BodyComponent from './BodyComponent';

import { isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownBodyChunkList, MarkdownBodyChunkTextParagraph, MarkdownNode } from '../md/types';

type BodyUnorderedListComponent = {
    data: MarkdownBodyChunkList
};

export default ( { data }: BodyUnorderedListComponent ) => {
    return <ul>
        {data.items.map((item, itemIdx) => 
            <li key={`li${itemIdx}`}><BodyComponent body={item} /></li>
        )}
    </ul>;
}



