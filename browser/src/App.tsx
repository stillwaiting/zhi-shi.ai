import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.scss';
import BodyComponent from './body/BodyComponent';
import TopicsTreeComponent from './TopicsTreeComponent';
import parse from './md/MarkdownParser';
import { isMarkdownBodyChunkList, isMarkdownBodyChunkTable, isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownNode } from './md/types';
import NodeHeaderComponent from './NodeHeaderComponent';
import { BrowserRouter as Router, Route, Link, useHistory, useLocation } from "react-router-dom";
import AppContext from './AppContext';
import copy from 'copy-to-clipboard';

 // @ts-ignore
import replaceAllInserter from 'string.prototype.replaceall';
import { getNodeText } from '@testing-library/react';
replaceAllInserter.shim();

// We have to use a custom separator because '#' might be treated specially both by browser, react router and 
// vscode extension's WebView
const ANCHOR_SEPARATOR = '|separator|';

function encodeTitle(title: string) {
  return encodeURI(title).replaceAll('/', '%2F');
}

function nodeLinkToHttpPath(titleAndMaybeAnchor: string, currentNodePath: string[]): string {
  if (titleAndMaybeAnchor.startsWith("..") && titleAndMaybeAnchor.indexOf('#') >= 0 && currentNodePath.length > 1) {
    const split = titleAndMaybeAnchor.split('#');
    return '/' +encodeTitle(currentNodePath[currentNodePath.length - 2]) + ANCHOR_SEPARATOR + encodeTitle(split[1]);
  } 

  if (titleAndMaybeAnchor.startsWith('#')) {
    return '/' + encodeTitle(currentNodePath[currentNodePath.length - 1]) + ANCHOR_SEPARATOR + encodeTitle(titleAndMaybeAnchor.substr(1));
  }

  if (titleAndMaybeAnchor === "..") {
    return '/' + encodeTitle(currentNodePath[currentNodePath.length - 2]);
  } 

  if (titleAndMaybeAnchor.indexOf('#') >= 0) {
    const split = titleAndMaybeAnchor.split('#');
    return '/' + encodeTitle(split[0]) + ANCHOR_SEPARATOR + encodeTitle(split[1]);
  }

  return '/' + encodeTitle(titleAndMaybeAnchor);
}

function httpPathToNodeLink(nodePath: string) {
  let title = nodePath.substr(1).replaceAll('%2F', '/');
  let anchor = '';

  if (title.indexOf(ANCHOR_SEPARATOR) >= 0) {
    const split = title.split(ANCHOR_SEPARATOR);
    title = split[0];
    anchor = split[1];
  }
  return [title, anchor];
}

function removeComments(s: string): string {
  if (s) {
    return s.replaceAll(/\/\*(.|\n)*?\*\//g, '');
  }
  return s;
}

declare global {
  interface Window { 
    externalText: string | undefined; 
    externalNodeTitle: string | undefined;
    externalNodeLine: number | undefined;
    externalSelectedText: string | undefined;
    externalGotoEditor: ((nodeTitle: string) => void) | undefined;
  }
}

function indexNodeByTitle(node: MarkdownNode, indexedNodes: {[key: string]: Array<MarkdownNode>}) {
  if (indexedNodes[node.title]) {
    indexedNodes[node.title].push(node);
  } else {
    indexedNodes[node.title] = [node];
  }
  node.children.forEach(child => {
    indexNodeByTitle(child, indexedNodes);
  });
}

function indexNodesByTitle(nodes: Array<MarkdownNode>) {
  const indexedNodes: {[key: string]: Array<MarkdownNode>} = {};

  nodes.forEach(node => {
    indexNodeByTitle(node, indexedNodes);
  });

  return indexedNodes;
}

function doesBodyContainAnchor(body: MarkdownBody, anchor: string): boolean {
  for (let chunkIdx = 0; chunkIdx < body.content.length; chunkIdx ++) {
    const bodyChunk = body.content[chunkIdx];
    if (isMarkdownBodyChunkTextParagraph(bodyChunk)) {
      if (bodyChunk.text.split('[#' + anchor + ']').length > 1) {
        return true;
      }
    } else if (isMarkdownBodyChunkList(bodyChunk)) {
      for (let itemIdx = 0; itemIdx < bodyChunk.items.length; itemIdx ++) {
          const listItem = bodyChunk.items[itemIdx];
          if (doesBodyContainAnchor(listItem, anchor)) {
            return true;
          }
      }
    } else if (isMarkdownBodyChunkTable(bodyChunk)) {
      for (let rowIdx = 0; rowIdx < bodyChunk.rows.length; rowIdx ++) {
        const row = bodyChunk.rows[rowIdx];
        for (let cellIdx = 0; cellIdx < row.cells.length; cellIdx++ ) {
          const cell = row.cells[cellIdx];
          if (doesBodyContainAnchor(cell.content, anchor)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

function isValidNodeLink(nodesByTitle: {[key: string]: Array<MarkdownNode>}, currentNodeTitle: string, link: string): boolean {
  const currentNode = nodesByTitle[currentNodeTitle][0];
  if (link === '..') {
    return currentNode.path.length > 1;
  }
  if (link.startsWith('..#')) {
    if (currentNode.path.length <= 1) {
      return false;
    }
    return doesBodyContainAnchor(nodesByTitle[currentNode.path[currentNode.path.length - 2]][0].body, link.substr(3));
  }
  if (link.startsWith('#')) {
    return doesBodyContainAnchor(currentNode.body, link.substr(1));
  }
  if (link.indexOf('#') >= 0) {
    const split = link.split('#');
    if (!nodesByTitle[split[0]] || nodesByTitle[split[0]].length == 0) {
      return false;
    }
    return doesBodyContainAnchor(nodesByTitle[split[0]][0].body, split[1]);
  }
  return nodesByTitle[link] && nodesByTitle[link].length > 0;
}

function App() {
  const [unsubmittedData, setUnsubmittedData] = useState<string>("");
  const [nodes, setNodes] = useState<MarkdownNode[]>([]);
  const [nodesByTitle, setNodesByTitle] = useState<{[key: string]: Array<MarkdownNode>}>({});
  const [topicsWidth, setTopicsWidth] = useState<number>(300);
  const [expandQuestions, setExpandQuestions] = useState<boolean>(false);

  const [externalText, setExternalText] = useState<string>("");
  const [externalNodeLine, setExternalNodeLine] = useState<number>(-1);
  const [externalSelectedText, setExternalSelectedText] = useState<string>("");

  const history = useHistory();
  const location = useLocation();

  const [currentNodeTitle, currentNodeAnchor] = httpPathToNodeLink(location.pathname);

  useEffect(() => {
      const interval = setInterval(() => {
        if (window.externalText && window.externalText !== externalText) {
          const nodes = parse(removeComments(window.externalText), []);
          setNodes(nodes);
          setNodesByTitle(indexNodesByTitle(nodes));
          setExternalText(window.externalText);
        }

        // must handle externalNodeLine === 0, therefore "!== undefined"
        if (window.externalNodeLine !== undefined && window.externalNodeTitle && window.externalNodeLine !== externalNodeLine) {
          const node = nodesByTitle[window.externalNodeTitle] ? nodesByTitle[window.externalNodeTitle][0] : undefined;
          if (node) {
            history.push(nodeLinkToHttpPath(node.title, []));
          }
          setExternalNodeLine(window.externalNodeLine);
        }

        // must handle externalSelectedText === '' (drop of selection), therefore "!== undefined"
        if (window.externalSelectedText !== undefined && window.externalSelectedText !== externalSelectedText) {
            setExternalSelectedText(window.externalSelectedText);
        }

      }, 500);

      return () => {
        clearInterval(interval);
      }
    },
  [nodes, history, externalText, externalNodeLine, externalSelectedText]);

  const onDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUnsubmittedData(e.currentTarget.value);
  }

  const onSubmitClicked = () => {
    const nodes = parse(removeComments(unsubmittedData), []);
    setNodes(nodes);
    setNodesByTitle(indexNodesByTitle(nodes));
  }

  const onIncreseWidthClick = () => {
    setTopicsWidth(topicsWidth + 50);
  }

  const onDecreaseWidthClick = () => {
    setTopicsWidth(topicsWidth - 50);
  }

  const currentNode = nodesByTitle[currentNodeTitle] ? nodesByTitle[currentNodeTitle][0] : undefined;

  return (
    <AppContext.Provider value={{
      currentNodeTitle: currentNodeTitle,
      linkRenderer: (link, text) => {
          const linkHtml = '<a href=\'' + link.split('"').join('&quot;') + '\' target="_blank">' + text + '</a>';
          if (isValidNodeLink(nodesByTitle, currentNodeTitle, link)) {
            return linkHtml;
          } else {
            return linkHtml + ' <span class="error">invalid link!</span>';
          }
      },
      currentNodeAnchor: currentNodeAnchor,
      currentSelectedText: externalSelectedText,
      expandQuestionAnswer: expandQuestions,
      onLinkClicked: (link) => {
        history.push(nodeLinkToHttpPath(link, currentNode ? currentNode.path : []));
      }
    }}>
      <div className="App">

        <div className="topics" style={{width: topicsWidth + 'px' }} data-testid='menu-container'>

          <a href='#' onClick={(e) => {
            e.preventDefault();
            onIncreseWidthClick();
          }} data-testid='plus'>+ width</a> |

          <a href='#' onClick={(e) => {
            e.preventDefault();
            onDecreaseWidthClick();
          }} data-testid='minus'>- width</a> <br />

      

          <TopicsTreeComponent nodes={nodes} onNodeClicked={(node) => {
            history.push(nodeLinkToHttpPath(node.title, []));
          }} />
        </div>

        <div className="content">

            <div>
                <a href='#' onClick={(e) => {
                e.preventDefault();
                window.history.back()
              }} data-testid='back'>back</a> |

              <a href='#' onClick={(e) => {
                e.preventDefault();
                window.history.forward();
              }} data-testid='forward'>forward</a> <br />
            </div>
            <div>
              <input type="checkbox" data-testid='expandAnswers' checked={expandQuestions} onChange={e => 
                  setExpandQuestions(!expandQuestions)} 
              /> expand questions
            </div>

            {Object.entries(nodesByTitle).filter(entity => entity[1].length > 1).map(badNodeEntity => 
                <div className='error' key={badNodeEntity[0]} data-testid='error'>
                  {badNodeEntity[0]} has {badNodeEntity[1].length} nodes!
                </div>
            )}

            {currentNode 
              ? <div>
                    <NodeHeaderComponent path={currentNode.path} onTitleClicked={(title) => 
                      history.push(nodeLinkToHttpPath(title, [])) 
                    } />
                    {window.externalGotoEditor && currentNode ? 
                      <div>
                          <a href='#' onClick={(e) => { 
                              e.preventDefault();
                              window.externalGotoEditor!(currentNode.title);
                          }}>goto in editor</a>
                      </div> : null
                    }

                    {currentNodeTitle 
                      ? <div>
                          <a href='#' onClick={(e) => {
                            e.preventDefault();
                            copy(currentNodeTitle + (currentNodeAnchor ? '#' + currentNodeAnchor : '') );
                          }}>copy link</a> 
                          | |
                          <a href='#' onClick={(e) => {
                            e.preventDefault();
                            const selectedNodes = document.getElementsByClassName('selectedNode');
                            if (selectedNodes.length > 0) {
                                const oldScrollY = window.scrollY;
                                selectedNodes[0].scrollIntoView();
                                window.scrollTo({
                                    left: window.scrollX,
                                    top: oldScrollY
                                });
                            }
                           }}>focus in tree</a>
                        </div>
                      : null}

                    
                    <BodyComponent body={currentNode.body} />
                </div>
              : 'Not selected'
            }
        </div>
        <hr />
        <textarea data-testid='textarea' onChange={onDataChange} value={String(unsubmittedData)} placeholder="Paste your data"></textarea>
        <hr />
        <button data-testid='submit' onClick={onSubmitClicked}>Submit</button>
      </div>
    </AppContext.Provider>
  );
}

export default App;

