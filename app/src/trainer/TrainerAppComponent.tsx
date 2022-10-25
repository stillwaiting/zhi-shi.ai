import React, { useEffect } from "react";
import { useState } from "react";
import BodyQuestionAnswerComponent, { Context } from "../body/BodyQuestionAnswerComponent";
import BrowserWarningComponent from "./BrowserWarningComponent";
import DataProviderComponent from "./DataProviderComponent";
import TaskSuggester, { TaskType } from "./TaskSuggester";
import { BrowserRouter as Router, Route, Link, useHistory, useLocation } from "react-router-dom";
import { PathBuilder } from "./PathBuilder";
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
    const [selectedRuleIdxs, setSelectedRuleIdxs] = useState<Set<number>>(new PathBuilder(location.pathname).getRules());
    const [answeredIndices, setAnsweredIndices] = useState<Array<number>|undefined>(undefined);
    const [canShowNextButton, setCanShowNextButton] = useState<boolean>(true);

    const history = useHistory();

    useEffect(() => {
        const newSelectedRules = new PathBuilder(location.pathname).getRules();
        setSelectedRuleIdxs(newSelectedRules);
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
        if (task) {
            return task.topicIdx;
        }
        return -1;
    }

    function getFilterHighlightedRuleIdx(): number {
        if (task) {
            return task.ruleIdx;
        }
        return -1;
    }

    return <div className='TrainerAppComponent'>
            <BrowserWarningComponent />
            <DataProviderComponent url={process.env.PUBLIC_URL + url} onDataProvided={(data) => {
                try {
                    const taskSuggester = new TaskSuggester(data);
                    taskSuggester.setSelectedRuleIdxs(selectedRuleIdxs);
                    getAnswersFromLocalStorage().forEach((answer) => {
                        taskSuggester.recordAnswer(answer[0], answer[1]);
                    });
                    taskSuggester.enableDebugLog();
                    setCurrentTask(taskSuggester.suggestNextTask());
                    setRawData(data);
                    setTaskSuggester(taskSuggester);
                } catch (ex) {
                    console.error(ex);
                    throw ex;
                }
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
                                history.push(new PathBuilder('').setSelection(selectedRuleIdxs).setScreen('filter').buildPath())
                            }}
                        />
                    </div>
                : null
            }

            {isFilterScreen() && taskSuggester
                ? 
                <div className="FilterEditorComponentContainer">
                        <FilterEditorComponent 
                            topics={taskSuggester!.getTopics()} 
                            selectedRuleIdxs={selectedRuleIdxs} 
                            highlightedTopicIdx={getFilterHighlightedTopicIdx()}
                            highlightedRuleIdx={getFilterHighlightedRuleIdx()}

                            lang={lang}

                            onChanged={(selectedRuleIdxs) => {
                                setSelectedRuleIdxs(selectedRuleIdxs);
                                history.push(new PathBuilder('').setSelection(selectedRuleIdxs).setScreen('filter').buildPath())
                            }} 
                            
                            onClose = {() => {
                                history.push(new PathBuilder('').setSelection(selectedRuleIdxs).buildPath());
                            }} 
                        />

                    <div className="resetStats">
                        <a href='#' onClick={
                            (e) => {
                                e.preventDefault();
                                if (window.confirm(lang.CONFIRM)) {
                                    setTaskSuggester(new TaskSuggester(rawData!));
                                    taskSuggester.enableDebugLog();
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
                                    setCanShowNextButton(isCorrect);
                                    if (!isCorrect) {
                                        setTimeout(() => {
                                            setCanShowNextButton(true);
                                        }, 3000);
                                    }
                                }
                            } 
                            answerIndices={answeredIndices}
                            submitLabel={lang.SUBMIT_BUTTON}
                        />


                        {answeredIndices && canShowNextButton
                            ? <div><button className="next" autoFocus onClick={() => {
                                setCurrentTask(taskSuggester!.suggestNextTask());
                                setQuestionCounter(questionCounter + 1);
                                setAnsweredIndices(undefined);
                            }}>{lang.NEXT_BUTTON}</button>
                            
                            <div className="linkToRule">
                            {
                                    taskSuggester!.getTopics()[task.topicIdx].rules.find(rule => rule.ruleIdx == task.ruleIdx)?.nodeTitle.replace("Rule:", "")
                                    }
                                (<a href={new PathBuilder('').setSelection(selectedRuleIdxs).setScreen('filter').buildPath()}
                                    onClick={
                                        (e) => {
                                            e.preventDefault();
                                            history.push(new PathBuilder('').setSelection(selectedRuleIdxs).setScreen('filter').buildPath());
                                        }
                                    }
                                >{lang.SHOW_IN_TREE}</a>)
                        </div>

                            </div>
                            : null
                        }

                    
                        
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
export function clearAnswersInLocalStorage() {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY_ANSWERS);
}

function getAnswersFromLocalStorage(): Array<[number, boolean]> {
    if (window.localStorage.getItem(LOCAL_STORAGE_KEY_ANSWERS)) {
        return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY_ANSWERS)!);
    }
    return [];
}

