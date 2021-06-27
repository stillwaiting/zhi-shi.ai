import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.scss';
import BodyComponent from './body/BodyComponent';
import TopicsTreeComponent from './TopicsTreeComponent';
import parse, { MarkdownNode } from './md/MarkdownParser';
import NodeHeaderComponent from './NodeHeaderComponent';
import { BrowserRouter as Router, Route, Link, useHistory, useLocation } from "react-router-dom";

function generateNodePath(path: Array<string>) {
  return '/' + path.map(item => encodeURI(item).replace('/', '%2F') ).join('/');
}

function findNode(nodes: Array<MarkdownNode>, path: Array<string>): MarkdownNode | null {
  if (path.length == 0) {
    return null;
  }
  let lastNode = nodes.find((node) => node.title == path[0]);
  if (!lastNode) {
    return null;
  }
  let pathIterator = 1

  while (pathIterator < path.length) {
    const childIdx: number | undefined = lastNode.childrenByTitleIndex[path[pathIterator]];
    if (childIdx === undefined) {
      return null;
    }
    lastNode = lastNode.children[childIdx];
    pathIterator ++ ;

  }
  return lastNode || null;
}

function App() {
  const [unsubmittedData, setUnsubmittedData] = useState<string>("");
  const [nodes, setNodes] = useState<MarkdownNode[]>([]);
  const [topicsWidth, setTopicsWidth] = useState<number>(300);
  const history = useHistory();
  const location = useLocation();
  const currentPath = location.pathname.split('/').slice(1).map(item => item.replace('%2F', '/'));

  useEffect(() => {
      fetch('https://stoic-swirles-1788c6.netlify.app/RU.md').then(response => {
        // console.log(response);
        return response.text();
      }).then(text => {
        setNodes(parse(text, []));
      });
    },
  []);

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

  const currentNode = findNode(nodes, currentPath);

  return (
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

        <TopicsTreeComponent nodes={nodes} currentNodePath={currentPath} onNodeClicked={(node) => {
          history.push(generateNodePath(node.path));
        }} />
      </div>

      <div className="content">
          {currentNode 
            ? <div>
                  <NodeHeaderComponent path={currentNode.path} onPathClicked={(path) => { history.push(generateNodePath(path)) }} />
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
  );
}

export default App;
