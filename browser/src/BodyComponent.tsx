import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';

import parse, { MarkdownBody, MarkdownNode } from './MarkdownParser';
import './TopicsTreeComponent.scss';

type BodyComponent = {
    body: MarkdownBody
};

export default ( { body }: BodyComponent ) => {
    return <div>
        ${body.content}
    </div>;
}



