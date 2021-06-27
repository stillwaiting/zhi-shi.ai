import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';

import parse, { MarkdownBody, MarkdownNode } from '../md/MarkdownParser';

type BodyComponent = {
    body: MarkdownBody
};

export default ( { body }: BodyComponent ) => {
    return <div>
        {body.content}
    </div>;
}



