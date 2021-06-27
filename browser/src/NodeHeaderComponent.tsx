import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';

import { MarkdownBody, MarkdownNode } from './md/types';

import './NodeHeaderComponent.scss';

type NodeHeaderComponent = {
    path: Array<string>,
    onPathClicked: (path: Array<string>) => void
};

export default ( { path, onPathClicked }: NodeHeaderComponent ) => {
    return <div className='NodeHeaderComponent' data-testid='NodeHeaderComponent'>
        {path.map((pathItem, index) => {
            const prefixPath = path.slice(0, index + 1);
            return <span key={`pathItem${index}`}> 
                    <span className='separator'>/</span>
                <a href='#' onClick={(e) => {
                        e.preventDefault();
                        onPathClicked(prefixPath);
                }}>{pathItem}</a>
            </span>;
        })}
    </div>;
}
