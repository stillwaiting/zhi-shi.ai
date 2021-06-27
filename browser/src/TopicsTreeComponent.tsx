import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';

import parse, { MarkdownNode } from './md/MarkdownParser';
import './TopicsTreeComponent.scss';

type TopicsTreeComponent = {
    nodes: MarkdownNode[],
    currentNodePath: Array<string>,
    onNodeClicked: (node: MarkdownNode) => any
}

function areArraysEqual(array1: Array<any>, array2: Array<any>) {
    return array1.length === array2.length && array1.every((value, index) => value === array2[index]);
}

const renderNodes = (nodes: MarkdownNode[], currentNodePath: Array<string>, onNodeClicked: (node: MarkdownNode) => any) => {
    if (nodes.length == 0) {
        return null;
    }
    return <ul>
        {nodes.map((node, nodeIdx) => {
            return <li key={`node${nodeIdx}`}>
                <a href='#' onClick={(e) => {
                    e.preventDefault();
                    onNodeClicked(node);
                }}
                
                className={areArraysEqual(node.path, currentNodePath) ? "selectedNode" : "plainNode"}
                
                >{node.title}</a> <br />
                {renderNodes(node.children, currentNodePath, onNodeClicked)}
            </li>;
        })}
    </ul>;
}

export default ({ nodes, onNodeClicked, currentNodePath }: TopicsTreeComponent ) => {
    return <div className="TopicsTreeComponent">
        {renderNodes(nodes, currentNodePath, onNodeClicked)}
    </div>;
}