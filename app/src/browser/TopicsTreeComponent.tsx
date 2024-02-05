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

function renderExpander(node: MarkdownNode, isNodeExpanded: boolean, onNodeExpanded: (nodeTitle: [string]) => void, onNodeCollapsed: (nodeTitle: [string]) => void) {
    return isNodeExpanded 
        ? <span>[<a href='#' onClick={(e) => {
            e.preventDefault();
            onNodeCollapsed([node.title]);
        }}>-</a>] </span>
        : <span>[<a href='#' onClick={(e) => {
            e.preventDefault();
            onNodeExpanded([node.title]);
        }}>+</a>] </span>;
}

function collectAllChildNodesToExpandCollapse(node: MarkdownNode, excludeCurrentNode: boolean = false): string[] {
    const nodeTitlesToExpand: string[] = [];
    const stackToProceed: MarkdownNode[] = [node];
    while (stackToProceed.length > 0) {
        const nodeFromStack = stackToProceed.pop()!;
        if (nodeFromStack.children.length > 0) {
            if (excludeCurrentNode && nodeFromStack == node) {

            } else {
                nodeTitlesToExpand.push(nodeFromStack.title);
            }
        }
        nodeFromStack.children.forEach(childNode => {
            stackToProceed.push(childNode);
        });
    }
    return nodeTitlesToExpand;
}

function renderAllChildExpaner(node: MarkdownNode, onNodeExpanded: (nodeTitle: string[]) => void, onNodeCollapsed: (nodeTitle: string[]) => void) {
    return <span>
        <a href='#' onClick={(e) => {
            e.preventDefault();
            onNodeExpanded(collectAllChildNodesToExpandCollapse(node));
        }}>++</a>/
        <a href='#' onClick={(e) => {
            e.preventDefault();
            onNodeCollapsed(collectAllChildNodesToExpandCollapse(node, true));
        }}>--</a>
    </span>;
}

function calculateCurrentNodeTitleExpansion(nodes: MarkdownNode[], currentNodeTitle: string, parents: MarkdownNode[] = []): Set<string> {
    const ret = new Set<string>();
    for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx ++) {
        const node = nodes[nodeIdx];
        if (node.title === currentNodeTitle) {
            ret.add(node.title);
            parents.forEach(parent => {
                ret.add(parent.title);
            });
            return ret;
        } else {
            const newParents = [...parents, node];
            const childrenExpanded = calculateCurrentNodeTitleExpansion(node.children, currentNodeTitle, newParents);
            if (childrenExpanded.size > 0) {
                return childrenExpanded;
            }
        }
    }
    return ret;
}

const renderNodes = (nodes: MarkdownNode[], expandedNodeTitles: Set<string>, currentNodeTitle: string, 
    onNodeClicked: (node: MarkdownNode) => any,
    onNodeExpanded: (nodeTitle: string[]) => void, 
    onNodeCollapsed: (nodeTitle: string[]) => void
) => {
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
                selectedClassName += ' error ';
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

            const isExpanded = expandedNodeTitles.has(node.title);

            return <li key={`node${nodeIdx}`}>
                {node.children.length > 0 
                    ? renderExpander(node, isExpanded, onNodeExpanded, onNodeCollapsed)
                    : null
                }

                {isSmallNumberOfQuestions ? <strong>! </strong> : null}
                <a href='#' onClick={(e) => {
                    e.preventDefault();
                    onNodeClicked(node);
                }}
                
                className={`${selectedClassName} ${highlightedClassName}`}
                
                >{title}</a> 
                
                {node.children.length > 0 ? renderAllChildExpaner(node, onNodeExpanded, onNodeCollapsed) : null}
                
                <br />
                {
                    isExpanded
                    ? renderNodes(node.children, expandedNodeTitles, currentNodeTitle, onNodeClicked, onNodeExpanded, onNodeCollapsed)
                    : null
                }
            </li>;
        })}
    </ul>;
}

export default ({ nodes, onNodeClicked }: TopicsTreeComponent ) => {

    const context = useContext(Context);
    const [manuallyExpandedNodeTitles, setManuallyExpandedNodeTitles] = useState<Set<string>>(new Set<string>());

    console.log(manuallyExpandedNodeTitles);
    return <div className="TopicsTreeComponent">
        {renderNodes(
            nodes, 
            new Set<string>([...manuallyExpandedNodeTitles, ...calculateCurrentNodeTitleExpansion(nodes, context.currentNodeTitle)]), 
            context.currentNodeTitle, 
            onNodeClicked,
            (nodeTitles: string[]) => {
                nodeTitles.forEach(nodeTitle => 
                    manuallyExpandedNodeTitles.add(nodeTitle)
                );
                setManuallyExpandedNodeTitles(new Set<string>([... manuallyExpandedNodeTitles]));
            }, 
            (nodeTitles: string[]) => {
                nodeTitles.forEach(nodeTitle => 
                    manuallyExpandedNodeTitles.delete(nodeTitle)
                );
                setManuallyExpandedNodeTitles(new Set<string>([... manuallyExpandedNodeTitles]));
            })
        }
    </div>;
}
