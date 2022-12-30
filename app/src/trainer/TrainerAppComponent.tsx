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

export function TrainerAppComponent({ lang, taskSuggester }: { lang: Language, taskSuggester: TaskSuggester }) {
    const location = useLocation();
    const [answeredIndices, setAnsweredIndices] = useState<Array<number>|undefined>(undefined);
    const [answersReplayed, setAnswersReplayed] = useState<boolean>(false);
    const [canShowNextButton, setCanShowNextButton] = useState<boolean>(true);
    const [path, setPath] = useState<PathBuilder>(new PathBuilder(location.pathname));

    const history = useHistory();

    function getTaskFromPath(builder: PathBuilder) {
        return (builder.getTaskIdx() >= 0 && taskSuggester)
        ? taskSuggester.getTask(builder.getTaskIdx())
        : null;
    }

    const currentTask = getTaskFromPath(path);

    function updatePathWithTask(builder: PathBuilder, task: TaskType) {
        builder.setTaskIdx(task.taskIdx)
    }

    useEffect(() => {
        if (!answersReplayed) {
            getAnswersFromLocalStorage().forEach((answer) => {
                taskSuggester.recordAnswer(answer[0], answer[1]);
            });
            setAnswersReplayed(true);
        }
    });

    useEffect(() => {
        const newPath = new PathBuilder(location.pathname);

        taskSuggester.setSelectedRuleIdxs(newPath.getRules());
        const newPathTask = getTaskFromPath(newPath);

        const newTaskOutsideSelection = newPathTask && !taskSuggester.isTaskInSelectedRules(newPathTask.taskIdx);
        const newPathWithoutTask = !!!newPathTask;

        if (newTaskOutsideSelection || newPathWithoutTask) {
            const newTask = taskSuggester.suggestNextTask();
            
            updatePathWithTask(newPath, newTask);
            setAnsweredIndices(undefined);
            history.push(newPath.buildPath());
        } else {
            if (newPathTask && currentTask && currentTask.taskIdx != newPathTask.taskIdx) {
                setAnsweredIndices(undefined);
            }
        }
        setPath(newPath);
    }, [location, taskSuggester]);

    function isFilterScreen() {
        return path.getScreen() === 'filter';
    }

    function getFilterHighlightedTopicIdx(): number {
        if (currentTask) {
            return currentTask.topicIdx;
        }
        return -1;
    }

    function getFilterHighlightedRuleIdx(): number {
        if (currentTask) {
            return currentTask.ruleIdx;
        }
        return -1;
    }

    return <Context.Provider value={{
        expandQuestionAnswer: false,
        currentNodeTitle: '',
        submitLabel: lang.SUBMIT_BUTTON,
        correctLabel: lang.CORRECT_LABEL
    }}>
        <div className="TrainerAppComponent">
                <div className="menu">
                    <FilterLinkComponent 
                        selectedRuleIdxs={path.getRules()} 
                        topics={taskSuggester.getTopics()} 
                        isActive={isFilterScreen()}
                        key={(answeredIndices ? 'answered' : '')}
                        lang={lang}
                        onClicked={() => {
                            const newPath = new PathBuilder('').populate(path).setScreen('filter');
                            history.push(newPath.buildPath());
                        }}
                    />
                </div>

            {isFilterScreen()
                ? 
                <div className="FilterEditorComponentContainer">
                        <FilterEditorComponent 
                            topics={taskSuggester!.getTopics()} 
                            selectedRuleIdxs={path.getRules()} 
                            highlightedTopicIdx={getFilterHighlightedTopicIdx()}
                            highlightedRuleIdx={getFilterHighlightedRuleIdx()}

                            lang={lang}

                            onChanged={(selectedRuleIdxs, shouldClose) => {
                                const newPath = new PathBuilder('').populate(path).setSelection(selectedRuleIdxs);
                                if (shouldClose) {
                                    newPath.setScreen(undefined);
                                }
                                history.push(newPath.buildPath())
                            }} 
                            
                            onClose = {() => {
                                const newPath = new PathBuilder('').populate(path).setScreen(undefined);
                                history.push(newPath.buildPath());
                            }} 
                        />

                    <div className="resetStats">
                        {path.getRules().size == 0 ? null : 
                            <div>
                                <a href='#' onClick={
                                    (e) => {
                                        e.preventDefault();
                                        if (window.confirm(lang.CONFIRM)) {
                                            taskSuggester.clearStatsForRules(path.getRules());
                                            clearAnswersInLocalStorageForRules(path.getRules(), taskSuggester);
                                            history.push(location.pathname + "?_=" + Math.random());
                                        }
                                    }
                                }>{lang.RESET_STATS_LINK.replace('%','' + path.getRules().size)}</a> <br /><br />
                            </div>
                        }
                    
                        <a href='#' onClick={
                            (e) => {
                                e.preventDefault();
                                if (window.confirm(lang.CONFIRM)) {
                                    taskSuggester.clearStats();
                                    clearAnswersInLocalStorage();
                                    history.push('/');
                                }
                            }
                        }>{lang.RESET_ALL_STATS_LINK}</a>
                    </div>

                </div>

               
                : null
            }

            {!isFilterScreen() && currentTask
                ? <div className="questionAnswer">
                        <BodyQuestionAnswerComponent data = {currentTask.bodyChunk} onAnswered={
                                (indices) => {
                                    const isCorrect = indices.filter(index => index == 0).length == indices.length;
                                    taskSuggester.recordAnswer(currentTask.taskIdx, isCorrect);
                                    addAnswerToLocalStorage(currentTask.taskIdx, isCorrect);
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
                        />


                        {answeredIndices && canShowNextButton
                            ? <div><button className="next" autoFocus onClick={() => {
                                const nextSuggestedTask = taskSuggester!.suggestNextTask();
                                const newPath = new PathBuilder('').populate(path);
                                updatePathWithTask(newPath, nextSuggestedTask);
                                setAnsweredIndices(undefined);
                                history.push(newPath.buildPath());
                            }}>{lang.NEXT_BUTTON}</button>
                            
                            <div className="linkToRule">
                            {
                                    taskSuggester!.getTopics()[currentTask.topicIdx].rules.find(rule => rule.ruleIdx == currentTask.ruleIdx)?.nodeTitle.replace("Rule:", "")
                                    }
                                (<a href={new PathBuilder('').populate(path).setScreen('filter').buildPath()}
                                    onClick={
                                        (e) => {
                                            e.preventDefault();
                                            const newPath = new PathBuilder('').populate(path).setScreen('filter');
                                            history.push(newPath.buildPath());
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

    </div>
    </Context.Provider>;
}


export default function({ url, lang }: { url:string, lang: Language }) {
    const [taskSuggester, setTaskSuggester] = useState<TaskSuggester | null>(null);

    return <div className='TrainerAppComponent'>
            <BrowserWarningComponent />
            <DataProviderComponent url={process.env.PUBLIC_URL + url} onDataProvided={(data) => {
                try {
                    const taskSuggester = new TaskSuggester(data);
                    setTaskSuggester(taskSuggester);
                    // taskSuggester.enableDebugLog();
                } catch (ex) {
                    console.error(ex);
                    throw ex;
                }
            }}
            />

            {taskSuggester ? <TrainerAppComponent lang={lang} taskSuggester={taskSuggester} /> : null}


            
            


{/* <Link data-testid='goto1' to='/1'>goto 1</Link>
            <Link data-testid='goto0' to='/0'>goto 0</Link>
            <Link data-testid='gotofilter' to='/filter'>goto filter</Link>
            <Link data-testid='goto' to='/'>goto root</Link> */}
            
    </div> ;
}

const LOCAL_STORAGE_KEY_ANSWERS = 'answers';

function addAnswerToLocalStorage(taskIdx: number, isCorrect: boolean) {
    const oldAnswers = getAnswersFromLocalStorage();

    const answers = oldAnswers.filter((item, index) => item[0] != taskIdx || index > oldAnswers.length - 500);
    answers.push([taskIdx, isCorrect]);
    if (answers.length > 1000) {
        answers.shift();
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY_ANSWERS, JSON.stringify(answers));
}
export function clearAnswersInLocalStorage() {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY_ANSWERS);
}

function clearAnswersInLocalStorageForRules(rules: Set<number>, taskSuggester: TaskSuggester) {
    const answers = getAnswersFromLocalStorage().filter(answer => {
        const ruleIdx = taskSuggester.getTaskRuleIdx(answer[0]);
        return !rules.has(ruleIdx);
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY_ANSWERS, JSON.stringify(answers));
}

function getAnswersFromLocalStorage(): Array<[number, boolean]> {
    if (window.localStorage.getItem(LOCAL_STORAGE_KEY_ANSWERS)) {
        return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY_ANSWERS)!);
    }
    return [];
}

