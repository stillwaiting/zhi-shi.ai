import React, { useState, useEffect } from 'react';
import './Browser.scss';
import BodyComponent from './../body/BodyComponent';
import TopicsTreeComponent from './TopicsTreeComponent';
import parse, { ParseResult } from './../md/MarkdownParser';
import { isMarkdownBodyChunkList, isMarkdownBodyChunkTable, isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownNode } from './../md/types';
import NodeHeaderComponent from './NodeHeaderComponent';
import { BrowserRouter as Router, Route, Link, useHistory, useLocation } from "react-router-dom";
import { Context as TextParagraphContext } from './../body/BodyTextParagraphComponent';
import { Context as QuestionAsnwerContext } from './../body/BodyQuestionAnswerComponent';
import copy from 'copy-to-clipboard';
// import raw from './test.md'

 // @ts-ignore
import replaceAllInserter from 'string.prototype.replaceall';
import DataProviderComponent from '../DataProviderComponent';
replaceAllInserter.shim();


// fetch(raw)
//   .then(r => r.text())
//   .then(text => {
//     console.log('text decoded:', text);
//   });

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

declare global {
  interface Window { 
    externalText: string | undefined; 
    externalNodeTitle: string | undefined;
    externalNodeLine: number | undefined;
    externalSelectedText: string | undefined;
    externalGotoEditor: ((nodeTitle: string) => void) | undefined;
  }
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

function isValidNodeLink(nodesByTitle: {[key: string]: MarkdownNode}, currentNodeTitle: string, link: string): boolean {
  const currentNode = nodesByTitle[currentNodeTitle];
  if (link === '..') {
    return currentNode.path.length > 1;
  }
  if (link.startsWith('..#')) {
    if (currentNode.path.length <= 1) {
      return false;
    }
    return doesBodyContainAnchor(nodesByTitle[currentNode.path[currentNode.path.length - 2]].body, link.substr(3));
  }
  if (link.startsWith('#')) {
    return doesBodyContainAnchor(currentNode.body, link.substr(1));
  }
  if (link.indexOf('#') >= 0) {
    const split = link.split('#');
    if (!nodesByTitle[split[0]]) {
      return false;
    }
    return doesBodyContainAnchor(nodesByTitle[split[0]].body, split[1]);
  }
  return !!nodesByTitle[link];
}

function saveTreeWidth(topicsWidth: number) {
    if (window.localStorage) {
      window.localStorage.setItem("treeWidth", "" + topicsWidth);
    }
}

function getSavedTopicWidth() {
  if (window.localStorage) {
    const savedWidth = window.localStorage.getItem("treeWidth");
    if (savedWidth) {
      return parseInt(savedWidth);
    }
  }
  return 300;
}

function Browser(props: { providedData: string | undefined }) {
  const [unsubmittedData, setUnsubmittedData] = useState<string>(props.providedData || '');
  const [nodes, setNodes] = useState<ParseResult>({
    parsedNodes: [],
    errors: [],
    indexedNodes: {}
  });
  const [topicsWidth, setTopicsWidth] = useState<number>(getSavedTopicWidth());
  const [expandQuestions, setExpandQuestions] = useState<boolean>(false);

  let [externalText, setExternalText] = useState<string>("");
  let [externalNodeLine, setExternalNodeLine] = useState<number>(-1);
  let [externalSelectedText, setExternalSelectedText] = useState<string>("");
  
  const history = useHistory();
  const location = useLocation();

  const [currentNodeTitle, currentNodeAnchor] = httpPathToNodeLink(location.pathname);

  useEffect(() => {
      const interval = setInterval(() => {
        if (window.externalText && window.externalText !== externalText) {
          const nodes = parse(window.externalText, []);
          setNodes(nodes);
          setExternalText(window.externalText);
          // For some reason, sometimes in tests setState doesn't 
          // trigger update, and when the 2nd time setInterval is exeuted
          // the body of "if" is executed multiple times. Most likely
          // react-testing-lib bug
          // TODO: try to remove later after bumping the version of the lib
          externalText = window.externalText;
        }

        // must handle externalNodeLine === 0, therefore "!== undefined"
        if (window.externalNodeLine !== undefined && window.externalNodeTitle && window.externalNodeLine !== externalNodeLine) {
          const node = nodes.indexedNodes[window.externalNodeTitle] ? nodes.indexedNodes[window.externalNodeTitle] : undefined;
          if (node) {
            history.push(nodeLinkToHttpPath(node.title, []));
          }
          setExternalNodeLine(window.externalNodeLine);
          // For some reason, sometimes in tests setState doesn't 
          // trigger update, and when the 2nd time setInterval is exeuted
          // the body of "if" is executed multiple times. Most likely
          // react-testing-lib bug
          // TODO: try to remove later after bumping the version of the lib
          externalNodeLine = window.externalNodeLine;
        }

        // must handle externalSelectedText === '' (drop of selection), therefore "!== undefined"
        if (window.externalSelectedText !== undefined && window.externalSelectedText !== externalSelectedText) {
            setExternalSelectedText(window.externalSelectedText);
            // For some reason, sometimes in tests setState doesn't 
            // trigger update, and when the 2nd time setInterval is exeuted
            // the body of "if" is executed multiple times. Most likely
            // react-testing-lib bug
            // TODO: try to remove later after bumping the version of the lib
            externalSelectedText = window.externalSelectedText;
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
    const nodes = parse(unsubmittedData, []);
    setNodes(nodes);
  }

  const onIncreseWidthClick = () => {
    setTopicsWidth(topicsWidth + 50);
    saveTreeWidth(topicsWidth + 50);
  }

  const onDecreaseWidthClick = () => {
    setTopicsWidth(topicsWidth - 50);
    saveTreeWidth(topicsWidth - 50);
  }

  const currentNode = nodes.indexedNodes[currentNodeTitle] ? nodes.indexedNodes[currentNodeTitle] : undefined;

  const COPY_REFIX = "copy:";
  const COPY_IMAGE_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAYCAYAAAAYl8YPAAAACXBIWXMAAACwAAAAsAEUaqtpAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAAp0RVh0VGl0bGUAQ29weUaQl90AAAAQdEVYdEF1dGhvcgBtaWdodHltYW7DdcowAAAAIXRFWHRDcmVhdGlvbiBUaW1lADIwMTAtMDQtMDdUMTk6MTk6MDOeH3TcAAAAPXRFWHRTb3VyY2UAaHR0cHM6Ly9vcGVuY2xpcGFydC5vcmcvZGV0YWlsLzM4ODgxL2NvcHktYnktbWlnaHR5bWFuQIt9qQAAAFh0RVh0Q29weXJpZ2h0AENDMCBQdWJsaWMgRG9tYWluIERlZGljYXRpb24gaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvcHVibGljZG9tYWluL3plcm8vMS4wL8bjvfkAAAMLSURBVDiNhZTPa1xVFMc/580LM0nzQ0yoNsEaJN0oopJSwUQpaBe6cSHiqq5U1H/AhRSCC8GtO8WNiKA0KxeiIEVQKFhBK6WL2jZircU00yT6fsy8d885XcxLMpPMjA/u4r177+d9zvcerrzzra1P1UlDApaAphASCCnkd6iv/ymX/AYvnj0vOf/zxLMTtN9cLOf7Tf7ya8TnX8bF2i1WT877S9//Ia1hsEiTwZMeoJwj2n6ZR1Q4exJvDIWF1AdOagnXN+HCDHMbp+yxcKi9+jy/1webpUPMCuevbfz+WyqTU2Fu/MlyMRkf+WKRn0f6rY/DEJgGmD/nI43Jci3SFnHRQsey5bhertDk3QMwy+UA5OpmRDOD8BC89akeCa0aZWuMUI6xfXuCc5+tn1pZ8jMrK2K9ZomLuyOyB/3pZsTxI4aMgNXBg+BBwMBn6/zw9dEnLp7nI/A3QHZDjzUTHOj2c4WFe43ooDTuzvQ9Um49Xnv6uRt88t1lf20HGFmfVtQcGHTIImSJy6VHWVh7iqWlCT4GF4BIExfft1GH9Lo75P86V5vuciwsyPH2M0uj/3zYKTOVnrzUIWSDxcydfAuZvWwys6EyPV4e0xkdX9642I417yyIpJOduhOywWbmzvIJqZ1Iii2tt/EH2+jRsnHhm9Yrsaa+qxXcCQ6aDc4sjiJef8/jwmS6sDrBG7SKCa79djONzAvMqvKsAg7JzKrhAohg4qiAkRO5paLegah3oGXqWB8z8yoGpxpeSThILnGrndWuXKmh5hSmBHXSO1OY93afd8ewA6mAwRyTTOLm38nqB6fXR50EyDFSJh949gV89HC3Vc/mHisoDMwzib+6/vDb+8t59T77Ua043Avai6Fj0/vNKCTqG3KKWxVad3k7EN1nGNQB+sOKBLzKa/fv5j1latdhlD4EhueoeW+79Jzk3olqZYsIcV8YibTDIeIAhULhRqlO6VAalOYUVr2ro2XnWusLy/M0e//05m2THCfHyMUtRyUX80wMxat7J/+vVQPYuNZs3AWFKDbDNon58AAAAABJRU5ErkJggg==";

  return (

    <QuestionAsnwerContext.Provider value={{
      currentNodeTitle: currentNodeTitle,
      expandQuestionAnswer: expandQuestions,
      submitLabel: 'Check',
      correctLabel: 'correct'
    }}>

    <TextParagraphContext.Provider value={{
      linkRenderer: (link, text) => {
          const linkHtml = '<a href=\'' + link.split('"').join('&quot;') + '\' target="_blank">' + text + '</a>';
          if (link.trim().startsWith("http")) {
            return linkHtml + " <sup><a href='" + COPY_REFIX + link + "' data-testid='copy'><img class='copy' src='" + COPY_IMAGE_SRC + "' height=10 /></a></sup>";
          } if (isValidNodeLink(nodes.indexedNodes, currentNodeTitle, link)) {
            return linkHtml;
          } else {
            return linkHtml + ' <span class="error">invalid link!</span>';
          }
      },
      currentNodeAnchor: currentNodeAnchor,
      currentSelectedText: externalSelectedText,
      onLinkClicked: (link, e) => {
        if (link.startsWith("http")) {
          return;
        }
        e.preventDefault();
        if (link.startsWith(COPY_REFIX)) {
          copy(link.substr(COPY_REFIX.length));
          return;
        }
        history.push(nodeLinkToHttpPath(link, currentNode ? currentNode.path : []));
      }
    }}>
      <div className="Browser">

        <div className="col">
          <div className="cell">
            <a href='#' onClick={(e) => {
              e.preventDefault();
              onIncreseWidthClick();
            }} data-testid='plus'>+ width</a> |

            <a href='#' onClick={(e) => {
              e.preventDefault();
              onDecreaseWidthClick();
            }} data-testid='minus'>- width</a> <br />
          </div>
          
          <div className="topics cell scrollable" style={{width: topicsWidth + 'px' }} data-testid='menu-container'>
            <TopicsTreeComponent nodes={nodes.parsedNodes} onNodeClicked={(node) => {
              history.push(nodeLinkToHttpPath(node.title, []));
            }} />

            <hr />
            <textarea data-testid='textarea' onChange={onDataChange} value={String(unsubmittedData)} placeholder="Paste your data"></textarea>
            <hr />
            <button data-testid='submit' onClick={onSubmitClicked}>Submit</button>
          </div>
        </div> 

        <div className="col colContent">

          <div className="cell">
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

              {nodes.errors.map((error, idx) =>
                  <div className='error' key={`key_error_${idx}`} data-testid='error'>
                    {error}
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

                      
                  </div>
                : 'Not selected'
              }
          </div>
          

          <div className="content cell scrollable">              
              {currentNode 
                ? <BodyComponent body={currentNode.body} />
                : 'Not selected'
              }
          </div>

        </div>
      
      </div>
    </TextParagraphContext.Provider>
    </QuestionAsnwerContext.Provider>
  );
}

export default (props: { url?: string }) => {
  const [providedData, setProvidedData] = useState<string | undefined>(undefined);

  if (!props.url) {
    return <Browser providedData={undefined} />
  } else {
    return providedData 
      ? <Browser providedData={providedData} />
      : <DataProviderComponent url={process.env.PUBLIC_URL + props.url} onDataProvided={(data) => {
                try {
                    setProvidedData(data);
                } catch (ex) {
                    console.error(ex);
                    throw ex;
                }
            }}
        />;
  }
};

