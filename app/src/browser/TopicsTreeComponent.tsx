import React, { useState, useEffect, useContext } from 'react';
import { Context } from './../body/BodyQuestionAnswerComponent';

import { isMarkdownBodyChunkQuestionAnswers, MarkdownBody, MarkdownBodyChunk, MarkdownNode } from './../md/types';
import './TopicsTreeComponent.scss';

type TopicsTreeComponent = {
    nodes: MarkdownNode[],
    onNodeClicked: (node: MarkdownNode) => any
}


function calculateNumberOfQuestions(body: MarkdownBody) {
    return body.content.filter(chunk => isMarkdownBodyChunkQuestionAnswers(chunk)).length;
}

const renderNodes = (nodes: MarkdownNode[], currentNodeTitle: string, onNodeClicked: (node: MarkdownNode) => any) => {
    if (!nodes || nodes.length == 0) {
        return null;
    }
    return <ul>
        {nodes.map((node, nodeIdx) => {
            let title = node.title.indexOf('Task') >= 0 
                ? node.title + ' (' + calculateNumberOfQuestions(node.body) + ')'
                : node.title;

            const error = (node.body.content.map(item => {
                if (isMarkdownBodyChunkQuestionAnswers(item)) {
                    if (item.question.text.indexOf('(') < 0) {
                        return item.question.text ;
                    }
                }
                return '';
            })).filter(item => item.length > 0);

            let className = (node.title === currentNodeTitle) ? "selectedNode" : "plainNode";
            if (error.length) {
                title += ' error: ' + error[0];
                className = 'error';
            }

            return <li key={`node${nodeIdx}`}>
                <a href='#' onClick={(e) => {
                    e.preventDefault();
                    onNodeClicked(node);
                }}
                
                className={className}
                
                >{title}</a> <br />
                {renderNodes(node.children, currentNodeTitle, onNodeClicked)}
            </li>;
        })}
    </ul>;
}

export default ({ nodes, onNodeClicked }: TopicsTreeComponent ) => {

    const context = useContext(Context);

    return <div className="TopicsTreeComponent">
        {renderNodes(nodes, context.currentNodeTitle, onNodeClicked)}
    </div>;
}
