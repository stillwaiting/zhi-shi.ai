import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';
import './BodyComponent.scss';

import { MarkdownBody, MarkdownNode } from '../md/types';

type BodyComponent = {
    body: MarkdownBody
};

export default ( { body }: BodyComponent ) => {
    return <pre className='BodyComponent'>
        {JSON.stringify(body.content, null, 2)}
    </pre>;
}



