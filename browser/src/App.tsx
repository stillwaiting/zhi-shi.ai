import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.scss';
import BodyComponent from './body/BodyComponent';
import TopicsTreeComponent from './TopicsTreeComponent';
import parse from './md/MarkdownParser';
import { MarkdownNode } from './md/types';
import NodeHeaderComponent from './NodeHeaderComponent';
import { BrowserRouter as Router, Route, Link, useHistory, useLocation } from "react-router-dom";
import AppContext from './AppContext';
import copy from 'copy-to-clipboard';

 // @ts-ignore
import replaceAllInserter from 'string.prototype.replaceall';
replaceAllInserter.shim();

function encodeTitle(title: string) {
  return encodeURI(title).replaceAll('/', '%2F');
}

function buildNodePath(titleAndMaybeAnchor: string, currentNodePath: string[]): string {
  if (titleAndMaybeAnchor.startsWith("..") && titleAndMaybeAnchor.indexOf('|') >= 0 && currentNodePath.length > 1) {
    const split = titleAndMaybeAnchor.split('|');
    return encodeTitle(currentNodePath[currentNodePath.length - 2]) + '|' + encodeTitle(split[1]);
  } 

  if (titleAndMaybeAnchor.startsWith('|')) {
    return encodeTitle(currentNodePath[currentNodePath.length - 1]) + '|' + encodeTitle(titleAndMaybeAnchor.substr(1));
  }

  if (titleAndMaybeAnchor === "..") {
    return encodeTitle(currentNodePath[currentNodePath.length - 2]);
  } 

  if (titleAndMaybeAnchor.indexOf('|') >= 0) {
    const split = titleAndMaybeAnchor.split('|');
    return encodeTitle(split[0]) + '|' + encodeTitle(split[1]);
  }

  return encodeTitle(titleAndMaybeAnchor);
}

function findNodeWithTitle(nodes: MarkdownNode[], title: string): MarkdownNode | null {
  for (let nodeIdx = 0; nodeIdx < nodes.length; nodeIdx++) {
    if (nodes[nodeIdx].title === title) {
      return nodes[nodeIdx];
    }
    const maybeFoundInChildren = findNodeWithTitle(nodes[nodeIdx].children, title);
    if (maybeFoundInChildren) {
      return maybeFoundInChildren;
    }
  }
  return null;
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

function parseNodePath(nodePath: string) {
  let title = nodePath.substr(1).replaceAll('%2F', '/');
  let anchor = '';

  if (title.indexOf('|') >= 0) {
    const split = title.split('|');
    title = split[0];
    anchor = split[1];
  }
  return [title, anchor];
}

function App() {
  const [unsubmittedData, setUnsubmittedData] = useState<string>("");
  const [nodes, setNodes] = useState<MarkdownNode[]>([]);
  const [topicsWidth, setTopicsWidth] = useState<number>(300);
  const [externalNodeTitle, setExternalNodeTitle] = useState<string>("");
  const [externalNodeLine, setExternalNodeLine] = useState<number>(0);
  const [externalSelectedText, setExternalSelectedText] = useState<string>("");

  const history = useHistory();
  const location = useLocation();

  const [currentNodeTitle, currentNodeAnchor] = parseNodePath(location.pathname);

  console.log(location.pathname, currentNodeTitle, currentNodeAnchor);

  useEffect(() => {
      const interval = setInterval(() => {
        if (window.externalText && window.externalText !== unsubmittedData) {
          setNodes(parse(window.externalText, []));
          setUnsubmittedData(window.externalText);
        }

        if (window.externalNodeLine && window.externalNodeTitle && window.externalNodeLine !== externalNodeLine) {
          const node = findNodeWithTitle(nodes, window.externalNodeTitle);
          if (node) {
            history.push(encodeTitle(node.title));
            setExternalNodeLine(window.externalNodeLine);
          }
        }

        if (window.externalSelectedText !== undefined && window.externalSelectedText !== externalSelectedText) {
            setExternalSelectedText(window.externalSelectedText);
        }

      }, 500);

      return () => {
        clearInterval(interval);
      }
      
    },
  [nodes, externalNodeLine, externalNodeTitle, externalSelectedText, unsubmittedData]);

  const onDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUnsubmittedData(e.currentTarget.value);
  }

  const onSubmitClicked = () => {
    setNodes(parse(unsubmittedData, []));
  }

  const onIncreseWidthClick = () => {
    setTopicsWidth(topicsWidth + 50);
  }

  const onDecreaseWidthClick = () => {
    setTopicsWidth(topicsWidth - 50);
  }

  const currentNode = findNodeWithTitle(nodes, currentNodeTitle);

  return (
    <AppContext.Provider value={{
      currentNodeTitle: currentNodeTitle,
      currentNodeAnchor: currentNodeAnchor,
      currentSelectedText: externalSelectedText,
      onLinkClicked: (link) => {
        history.push(buildNodePath(link, currentNode ? currentNode.path : []));
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
            history.push(encodeTitle(node.title));
          }} />
        </div>

        <div className="content">
            {currentNode 
              ? <div>
                    <NodeHeaderComponent path={currentNode.path} onTitleClicked={(title) => history.push(encodeTitle(title)) } />
                    {window.externalGotoEditor && currentNode ? 
                      <div>
                          <a href='#' onClick={(e) => { 
                              e.preventDefault();
                              window.externalGotoEditor!(currentNode.title);
                          }}>goto</a>
                      </div> : null
                    }

                    {currentNodeTitle 
                      ? <div>
                          <a href='#' onClick={(e) => {
                            e.preventDefault();
                            copy(currentNodeTitle + (currentNodeAnchor ? '#' + currentNodeAnchor : '') );
                          }}>copy link</a>
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
