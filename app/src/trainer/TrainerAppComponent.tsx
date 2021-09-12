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

export default function({ url }: { url:string }) {
    const location = useLocation();
    const [task, setCurrentTask] = useState<TaskType | null>(null);
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

    function isStatsScreen() {
        return location.pathname.indexOf('stats') >= 0;
    }
    
    return <div className='TrainerAppComponent'>
            <BrowserWarningComponent />
            <DataProviderComponent url={process.env.PUBLIC_URL + url} onDataProvided={(data) => {
                 const taskSuggester = new TaskSuggester(data);
                 taskSuggester.setSelectedRuleIdxs(selectedRuleIdxs);
                 setCurrentTask(taskSuggester.suggestNextTask());
                 setTaskSuggester(taskSuggester);
            }}
            />

            {taskSuggester 
                ? <div>
                        <FilterLinkComponent 
                            selectedRuleIdxs={selectedRuleIdxs} 
                            topics={taskSuggester.getTopics()} 
                            isActive={isFilterScreen()}
                            key={questionCounter + (answeredIndices ? 'answered' : '')}
                            onClicked={() => {
                                history.push(buildPath(selectedRuleIdxs, 'filter'))
                            }}
                        />
                    </div>
                : null
            }

            {isFilterScreen() && taskSuggester
                ? <FilterEditorComponent topics={taskSuggester!.getTopics()} selectedRuleIdxs={selectedRuleIdxs} onChanged={(selectedRuleIdxs) => {
                    setSelectedRuleIdxs(selectedRuleIdxs);
                    history.push(buildPath(selectedRuleIdxs, 'filter'))
                }} onClose = {() => {
                    history.push(buildPath(selectedRuleIdxs, ''));
                }} />
                : null
            }

            {!isFilterScreen() && !!task 
                ? <div className="questionAnswer">
                        <BodyQuestionAnswerComponent key={questionCounter} data = {task.bodyChunk} onAnswered={
                                (indices) => {
                                    taskSuggester!.recordAnswer(task.taskIdx, indices.filter(index => index == 0).length == indices.length);
                                    setAnsweredIndices(indices);
                                }
                            } 
                            answerIndices={answeredIndices}
                        />
                        
                    </div>
                : null
            }
            {!isFilterScreen() && answeredIndices
                ? <div><button onClick={() => {
                    setCurrentTask(taskSuggester!.suggestNextTask());
                    setQuestionCounter(questionCounter + 1);
                    setAnsweredIndices(undefined);
                }}>Next</button></div>
                : null
            }


{/* <Link data-testid='goto1' to='/1'>goto 1</Link>
            <Link data-testid='goto0' to='/0'>goto 0</Link>
            <Link data-testid='gotofilter' to='/filter'>goto filter</Link>
            <Link data-testid='goto' to='/'>goto root</Link> */}
            
    </div> ;
}