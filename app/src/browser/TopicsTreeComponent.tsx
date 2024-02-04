import React, { useState, useEffect, useContext } from 'react';
import { Context } from './../body/BodyQuestionAnswerComponent';

import { isMarkdownBodyChunkQuestionAnswers, MarkdownBody, MarkdownBodyChunk, MarkdownNode } from './../md/types';
import './TopicsTreeComponent.scss';

type TopicsTreeComponent = {
    nodes: MarkdownNode[],
    onNodeClicked: (node: MarkdownNode) => any,
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
            const isTaskNode = node.title.indexOf('Task') >= 0;
            let numberOfTaskQuestions = isTaskNode ? calculateNumberOfQuestions(node.body) : -1;

    
            let title = isTaskNode
                ? node.title + ` (${numberOfTaskQuestions})`
                : node.title;

            const error = (node.body.content.map(item => {
                if (isMarkdownBodyChunkQuestionAnswers(item)) {
                    if (item.question.text.indexOf('(') < 0) {
                        return item.question.text ;
                    }
                }
                return '';
            })).filter(item => item.length > 0);

            let selectedClassName = (node.title === currentNodeTitle) ? "selectedNode" : "plainNode";
            if (error.length) {
                title += ' error: ' + error[0];
                selectedClassName = 'error';
            }

            let highlightedClassName = "";
            let isSmallNumberOfQuestions = false;
            if (node.title.indexOf("[") >= 0 && node.title.indexOf("]") >= 0) {
                const hl = node.title.split("[")[1].split("]")[0];
                highlightedClassName = `${hl}Hl`;
            } else if (isTaskNode && numberOfTaskQuestions < 10) {
                isSmallNumberOfQuestions = true;
            } else if (node.title.indexOf('Rule') >= 0) {
                highlightedClassName = `ruleHl`;
            }

            return <li key={`node${nodeIdx}`}>
                {isSmallNumberOfQuestions ? <strong>! </strong> : null}
                <a href='#' onClick={(e) => {
                    e.preventDefault();
                    onNodeClicked(node);
                }}
                
                className={`${selectedClassName} ${highlightedClassName}`}
                
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
