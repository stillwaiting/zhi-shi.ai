import React, { useEffect } from "react";
import { useState } from "react";
import BodyQuestionAnswerComponent, { Context } from "../body/BodyQuestionAnswerComponent";
import BrowserWarningComponent from "./BrowserWarningComponent";
import DataProviderComponent from "./DataProviderComponent";
import TaskSuggester, { TaskType } from "./TaskSuggester";
import { BrowserRouter as Router, Route, Link, useHistory, useLocation } from "react-router-dom";
import { buildPath, extractSelectedRuleIdxsFromPath } from "./pathutils";
import FilterLinkComponent from './FilterLinkComponent';
import FilterEditorComponent from './FilterEditorComponent';
import './TrainerAppComponent.scss';
import { config } from "node:process";
import { Language } from './LanguageType';

export default function({ url, lang }: { url:string, lang: Language }) {
    const location = useLocation();
    const [task, setCurrentTask] = useState<TaskType | null>(null);
    const [rawData, setRawData] = useState<string | undefined>(undefined);
    const [taskSuggester, setTaskSuggester] = useState<TaskSuggester | null>(null);
    const [questionCounter, setQuestionCounter] = useState<number>(0);
    const [selectedRuleIdxs, setSelectedRuleIdxs] = useState<Set<number>>(extractSelectedRuleIdxsFromPath(location.pathname));
    const [answeredIndices, setAnsweredIndices] = useState<Array<number>|undefined>(undefined);

    const history = useHistory();

    useEffect(() => {
        const newSelectedRules = extractSelectedRuleIdxsFromPath(location.pathname);
        setSelectedRuleIdxs(extractSelectedRuleIdxsFromPath(location.pathname));
        if (taskSuggester) {
            taskSuggester.setSelectedRuleIdxs(newSelectedRules);
            if (!taskSuggester.isTaskInSelectedRules(task!.taskIdx)) {
                setCurrentTask(taskSuggester.suggestNextTask());
                setAnsweredIndices(undefined);
            }
        }
    }, [location.pathname, task, taskSuggester, history]);

    function isFilterScreen() {
        return location.pathname.indexOf('filter') >= 0;
    }

    function getFilterHighlightedTopicIdx(): number {
        const split = location.pathname.split('/');
        if (split[split.length - 1] == 'filter') {
            return -1;
        }
        return parseInt(split[split.length-2]);
    }

    function getFilterHighlightedRuleIdx(): number {
        const split = location.pathname.split('/');
        if (split[split.length - 1] == 'filter') {
            return -1;
        }
        return parseInt(split[split.length-1]);
    }

    return <div className='TrainerAppComponent'>
            <BrowserWarningComponent />
            <DataProviderComponent url={process.env.PUBLIC_URL + url} onDataProvided={(data) => {
                const taskSuggester = new TaskSuggester(data);
                taskSuggester.setSelectedRuleIdxs(selectedRuleIdxs);
                getAnswersFromLocalStorage().forEach((answer) => {
                    taskSuggester.recordAnswer(answer[0], answer[1]);
                });
                setCurrentTask(taskSuggester.suggestNextTask());
                setRawData(data);
                setTaskSuggester(taskSuggester);
            }}
            />

            {taskSuggester 
                ? <div className="menu">
                        <FilterLinkComponent 
                            selectedRuleIdxs={selectedRuleIdxs} 
                            topics={taskSuggester.getTopics()} 
                            isActive={isFilterScreen()}
                            key={questionCounter + (answeredIndices ? 'answered' : '')}
                            lang={lang}
                            onClicked={() => {
                                history.push(buildPath(selectedRuleIdxs, 'filter'))
                            }}
                        />
                    </div>
                : null
            }

            {isFilterScreen() && taskSuggester
                ? 
                <div>
                        <FilterEditorComponent 
                            topics={taskSuggester!.getTopics()} 
                            selectedRuleIdxs={selectedRuleIdxs} 
                            highlightedTopicIdx={getFilterHighlightedTopicIdx()}
                            highlightedRuleIdx={getFilterHighlightedRuleIdx()}

                            lang={lang}

                            onChanged={(selectedRuleIdxs) => {
                                setSelectedRuleIdxs(selectedRuleIdxs);
                                history.push(buildPath(selectedRuleIdxs, 'filter'))
                            }} 
                            
                            onClose = {() => {
                                history.push(buildPath(selectedRuleIdxs, ''));
                            }} 
                        />

                    <div className="resetStats">
                        <a href='#' onClick={
                            (e) => {
                                e.preventDefault();
                                if (window.confirm(lang.CONFIRM)) {
                                    setTaskSuggester(new TaskSuggester(rawData!));
                                    taskSuggester.setSelectedRuleIdxs(selectedRuleIdxs);
                                    setCurrentTask(taskSuggester.suggestNextTask());
                                    clearAnswersInLocalStorage();
                                    history.push('/');
                                }
                            }
                        }>{lang.RESET_ALL_STATS_LINK}</a>
                    </div>

                </div>

               
                : null
            }

            {!isFilterScreen() && task && taskSuggester
                ? <div className="questionAnswer">
                        <BodyQuestionAnswerComponent key={questionCounter} data = {task.bodyChunk} onAnswered={
                                (indices) => {
                                    const isCorrect = indices.filter(index => index == 0).length == indices.length;
                                    taskSuggester!.recordAnswer(task.taskIdx, isCorrect);
                                    addAnswerToLocalStorage(task.taskIdx, isCorrect);
                                    setAnsweredIndices(indices);
                                }
                            } 
                            answerIndices={answeredIndices}
                            submitLabel={lang.SUBMIT_BUTTON}
                        />


                        {answeredIndices
                            ? <div><button className="next" autoFocus onClick={() => {
                                setCurrentTask(taskSuggester!.suggestNextTask());
                                setQuestionCounter(questionCounter + 1);
                                setAnsweredIndices(undefined);
                            }}>{lang.NEXT_BUTTON}</button></div>
                            : null
                        }

                        <div className="linkToRule">
                                <a href={buildPath(selectedRuleIdxs, "filter")}
                                    onClick={
                                        (e) => {
                                            e.preventDefault();
                                            history.push(buildPath(selectedRuleIdxs, "filter") + '/' + task.topicIdx + '/' + task.ruleIdx);
                                        }
                                    }
                                >{
                                    taskSuggester!.getTopics()[task.topicIdx].rules.find(rule => rule.ruleIdx == task.ruleIdx)?.nodeTitle.replace("Rule:", "")
                                    }</a>
                        </div>
                        
                    </div>
                : null
            }


            
            <div className='foundError'>
                <a href='https://github.com/stillwaiting/zhi-shi.ai/issues/new' target='_blank'>{lang.FOUND_ERROR}</a>
            </div>
            


{/* <Link data-testid='goto1' to='/1'>goto 1</Link>
            <Link data-testid='goto0' to='/0'>goto 0</Link>
            <Link data-testid='gotofilter' to='/filter'>goto filter</Link>
            <Link data-testid='goto' to='/'>goto root</Link> */}
            
    </div> ;
}

const LOCAL_STORAGE_KEY_ANSWERS = 'answers';

function addAnswerToLocalStorage(taskIdx: number, isCorrect: boolean) {
    const answers = getAnswersFromLocalStorage();
    answers.push([taskIdx, isCorrect]);
    if (answers.length > 1000) {
        answers.shift();
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY_ANSWERS, JSON.stringify(answers));
}
function clearAnswersInLocalStorage() {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY_ANSWERS);
}

function getAnswersFromLocalStorage(): Array<[number, boolean]> {
    if (window.localStorage.getItem(LOCAL_STORAGE_KEY_ANSWERS)) {
        return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY_ANSWERS)!);
    }
    return [];
}

