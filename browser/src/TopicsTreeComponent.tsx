import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';

import parse, { MarkdownNode } from './MarkdownParser';
import './TopicsTreeComponent.scss';

type TopicsTreeComponent = {
    nodes: MarkdownNode[]
}

const renderNodes = (nodes: MarkdownNode[]) => {
    if (nodes.length == 0) {
        return null;
    }
    return <ul>
        {nodes.map((node, nodeIdx) => {
            return <li key={`node${nodeIdx}`}>
                {node.title} <br />
                {renderNodes(node.children)}
            </li>;
        })}
    </ul>;
}

export default ({ nodes }: TopicsTreeComponent ) => {
    return <div className="TopicsTreeComponent">
        {renderNodes(nodes)}
    </div>;
}