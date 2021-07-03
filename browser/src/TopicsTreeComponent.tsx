import { getNodeText } from '@testing-library/dom';
import React, { useState, useEffect, useContext } from 'react';
import AppContext from './AppContext';

import { MarkdownNode } from './md/types';
import './TopicsTreeComponent.scss';

type TopicsTreeComponent = {
    nodes: MarkdownNode[],
    onNodeClicked: (node: MarkdownNode) => any
}

const renderNodes = (nodes: MarkdownNode[], currentNodeTitle: string, onNodeClicked: (node: MarkdownNode) => any) => {
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
                
                className={(node.title === currentNodeTitle) ? "selectedNode" : "plainNode"}
                
                >{node.title}</a> <br />
                {renderNodes(node.children, currentNodeTitle, onNodeClicked)}
            </li>;
        })}
    </ul>;
}

export default ({ nodes, onNodeClicked }: TopicsTreeComponent ) => {

    const context = useContext(AppContext);

    useEffect(() => {
        const timeout = setTimeout(()=> {
            const selectedNodes = document.getElementsByClassName('selectedNode');
            if (selectedNodes.length > 0) {
                const oldScrollY = window.scrollY;
                selectedNodes[0].scrollIntoView();
                window.scrollTo({
                    left: window.scrollX,
                    top: oldScrollY
                });
            }
        }, 0);

        return () => {
            clearTimeout(timeout);
        }
    }, [context.currentNodeTitle]);

    return <div className="TopicsTreeComponent">
        {renderNodes(nodes, context.currentNodeTitle, onNodeClicked)}
    </div>;
}