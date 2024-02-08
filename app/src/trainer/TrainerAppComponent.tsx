import React, { useEffect } from "react";
import { useState } from "react";
import BodyQuestionAnswerComponent, { Context } from "../body/BodyQuestionAnswerComponent";
import BrowserWarningComponent from "./BrowserWarningComponent";
import DataProviderComponent from "./../DataProviderComponent";
import TaskSuggester, { TaskType } from "./TaskSuggester";
import { BrowserRouter as Router, Route, Link, useHistory, useLocation } from "react-router-dom";
import { PathBuilder } from "./PathBuilder";
import FilterLinkComponent from './FilterLinkComponent';
import FilterEditorComponent from './FilterEditorComponent';
import './TrainerAppComponent.scss';
import { config } from "node:process";
import { Language } from './LanguageType';
import Hasher from "./Hasher";
import { has } from "lodash";
import { DarkModeManager } from "./DarkModeManager";

export function TrainerAppComponent({ lang, taskSuggester, darkModeManager }: { lang: Language, taskSuggester: TaskSuggester, darkModeManager: DarkModeManager }) {
    const location = useLocation();

    const [answeredIndices, setAnsweredIndices] = useState<Array<number>|undefined>(undefined);
    const [currentlyAnsweredTaskIdx, setCurrentlyAnsweredTaskIdx] = useState<number | undefined>(undefined);
    const [darkMode, setDarkMode] = useState<boolean>(darkModeManager.isDarkMode());

    const [answersReplayed, setAnswersReplayed] = useState<boolean>(false);
    const [canShowNextButton, setCanShowNextButton] = useState<boolean>(true);
    const [hasher, setHasher] = useState<Hasher>(() => {
        const hasher = new Hasher();
        taskSuggester.getTopics().forEach(topic => {
            topic.rules.forEach(rule => {
                hasher.addRule(rule);
                rule.taskIdxs.forEach(taskIdx => {
                    hasher.addTask(taskSuggester.getTask(taskIdx));
                })
            });
        });
        return hasher;
    });

    const history = useHistory();
    const path = new PathBuilder(location.pathname, hasher);
    taskSuggester.setSelectedRuleIdxs(path.getRules());

    const currentTask = path.getTaskIdx() >= 0 ? taskSuggester.getTask(path.getTaskIdx()) : taskSuggester.suggestNextTask();

    useEffect(() => {
        if (!answersReplayed) {
            getAnswersFromLocalStorage(hasher).forEach((answer) => {
                taskSuggester.recordAnswer(answer[0], answer[1]);
            });
            setAnswersReplayed(true);
        }
    });

    useEffect(() => {
        const newPath = new PathBuilder(location.pathname, hasher);
        console.log("useEffect", location.pathname, "pathTaskIdx=", newPath.getTaskIdx());
        console.log("currentTask", currentTask.taskIdx);
        if (newPath.getTaskIdx() == -1 || newPath.getTaskIdx() != currentTask.taskIdx) {
            
            newPath.setTaskIdx(currentTask.taskIdx);
            setAnsweredIndices(undefined);
            setCurrentlyAnsweredTaskIdx(undefined);
            history.replace(newPath.buildPath());
            console.log("Correcting to target current task", newPath.buildPath());
            return;
        }

        taskSuggester.setSelectedRuleIdxs(newPath.getRules());

        if (!taskSuggester.isTaskInSelectedRules(newPath.getTaskIdx())) {
            const newTask = taskSuggester.suggestNextTask();
            
            newPath.setTaskIdx(newTask.taskIdx);
            setAnsweredIndices(undefined);
            setCurrentlyAnsweredTaskIdx(undefined);
            history.replace(newPath.buildPath());
            console.log("Correcting to be in selection", newPath.buildPath());
            return;
        }

        if (currentlyAnsweredTaskIdx !== undefined && currentlyAnsweredTaskIdx != newPath.getTaskIdx()) {
            setAnsweredIndices(undefined);
            setCurrentlyAnsweredTaskIdx(undefined);
            console.log("Dropping answer as the task changed");
            return;
        }

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
                            const newPath = new PathBuilder('', hasher).populate(path).setScreen('filter');
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
                                const newPath = new PathBuilder('', hasher).populate(path).setSelection(selectedRuleIdxs);
                                if (shouldClose) {
                                    newPath.setScreen(undefined);
                                }
                                history.push(newPath.buildPath())
                            }} 
                            
                            onClose = {() => {
                                const newPath = new PathBuilder('', hasher).populate(path).setScreen(undefined);
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
                                            clearAnswersInLocalStorageForRules(path.getRules(), hasher, taskSuggester);
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
                                    addAnswerToLocalStorage(currentTask.taskIdx, hasher, isCorrect);
                                    setAnsweredIndices(indices);
                                    setCurrentlyAnsweredTaskIdx(currentTask.taskIdx);
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
                                const newPath = new PathBuilder('', hasher).populate(path);
                                newPath.setTaskIdx(nextSuggestedTask.taskIdx);
                                setAnsweredIndices(undefined);
                                setCurrentlyAnsweredTaskIdx(undefined);
                                history.push(newPath.buildPath());
                            }}>{lang.NEXT_BUTTON}</button>
                            
                            <div className="linkToRule">
                            {
                                    taskSuggester!.getTopics()[currentTask.topicIdx].rules.find(rule => rule.ruleIdx == currentTask.ruleIdx)?.nodeTitle.replace("Rule:", "")
                                    }
                                (<a href={new PathBuilder('', hasher).populate(path).setScreen('filter').buildPath()}
                                    onClick={
                                        (e) => {
                                            e.preventDefault();
                                            const newPath = new PathBuilder('', hasher).populate(path).setScreen('filter');
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

    <div className='darkMode'>
                <a href='#' onClick={(e) => {
                    e.preventDefault();
                    setDarkMode(!darkMode);
                    darkModeManager.setDarkMode(!darkModeManager.isDarkMode());
                }}>{darkMode ? lang.MODE_LIGHT : lang.MODE_DARK}</a>
            </div>

    </Context.Provider>;
}


export default function({ url, lang }: { url:string, lang: Language }) {
    const [taskSuggester, setTaskSuggester] = useState<TaskSuggester | null>(null);
    const darkModeManager = new DarkModeManager();

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

            {taskSuggester ? <TrainerAppComponent lang={lang} taskSuggester={taskSuggester} darkModeManager={darkModeManager} /> : null}


            
            


{/* <Link data-testid='goto1' to='/1'>goto 1</Link>
            <Link data-testid='goto0' to='/0'>goto 0</Link>
            <Link data-testid='gotofilter' to='/filter'>goto filter</Link>
            <Link data-testid='goto' to='/'>goto root</Link> */}
            
    </div> ;
}

const LOCAL_STORAGE_KEY_ANSWERS = 'answers';

function addAnswerToLocalStorage(taskIdx: number, hasher: Hasher, isCorrect: boolean) {
    const oldAnswers = getAnswersFromLocalStorage(hasher);

    const answers = oldAnswers.filter((item, index) => item[0] != taskIdx || index > oldAnswers.length - 500);
    answers.push([taskIdx, isCorrect]);
    if (answers.length > 1000) {
        answers.shift();
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY_ANSWERS, JSON.stringify(answers.map(answer => 
        [hasher.taskIdxToHash(answer[0]), answer[1]]
    )));
}
export function clearAnswersInLocalStorage() {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY_ANSWERS);
}

function clearAnswersInLocalStorageForRules(rules: Set<number>, hasher: Hasher, taskSuggester: TaskSuggester) {
    const answers = getAnswersFromLocalStorage(hasher).filter(answer => {
        const ruleIdx = taskSuggester.getTaskRuleIdx(answer[0]);
        return !rules.has(ruleIdx);
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY_ANSWERS, JSON.stringify(answers.map(answer => 
        [hasher.taskIdxToHash(answer[0]), answer[1]]
    )));
}

function getAnswersFromLocalStorage(hasher: Hasher): Array<[number, boolean]> {
    if (window.localStorage.getItem(LOCAL_STORAGE_KEY_ANSWERS)) {
        // @ts-ignore
        return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY_ANSWERS) || '[]')
            .filter((answer: Array<any>) => !!hasher.hashToTaskIdx(answer[0]))
            .map((answer: Array<any>) => 
                [hasher.hashToTaskIdx(answer[0]), answer[1]]
            );
    }
    return [];
}

