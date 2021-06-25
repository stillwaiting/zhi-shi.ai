import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';

import parse, { MarkdownNode } from './MarkdownParser';
import './TopicsTreeComponent.scss';

type TopicsTreeComponent = {
    nodes: MarkdownNode[],
    onNodeClicked: (node: MarkdownNode) => any
}

const renderNodes = (nodes: MarkdownNode[], onNodeClicked: (node: MarkdownNode) => any) => {
    if (nodes.length == 0) {
        return null;
    }
    return <ul>
        {nodes.map((node, nodeIdx) => {
            return <li key={`node${nodeIdx}`}>
                <a href='#' onClick={(e) => {
                    e.preventDefault();
                    onNodeClicked(node);
                }}>{node.title}</a> <br />
                {renderNodes(node.children, onNodeClicked)}
            </li>;
        })}
    </ul>;
}

export default ({ nodes, onNodeClicked }: TopicsTreeComponent ) => {
    return <div className="TopicsTreeComponent">
        {renderNodes(nodes, onNodeClicked)}
    </div>;
}