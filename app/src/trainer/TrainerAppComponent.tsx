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

export default function({ url }: { url:string }) {
    const location = useLocation();
    const [task, setCurrentTask] = useState<TaskType | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [taskSuggester, setTaskSuggester] = useState<TaskSuggester | null>(null);
    const [questionCounter, setQuestionCounter] = useState<number>(0);
    const [selectedRuleIdxs, setSelectedRuleIdxs] = useState<Array<number>>(extractSelectedRuleIdxsFromPath(location.pathname));

    const history = useHistory();

    useEffect(() => {
        const newSelectedRules = extractSelectedRuleIdxsFromPath(location.pathname);
        setSelectedRuleIdxs(extractSelectedRuleIdxsFromPath(location.pathname));
        if (taskSuggester) {
            taskSuggester.setSelectedRuleIdxs(newSelectedRules);
            if (!taskSuggester.isTaskInSelectedRules(task!.taskIdx)) {
                setCurrentTask(taskSuggester.suggestNextTask());
            }
        }
    }, [location.pathname, task, taskSuggester, history]);

    function isFilterScreen() {
        return location.pathname.indexOf('filter') >= 0;
    }
    
    return <div className='TrainerComponent'>
            <BrowserWarningComponent />
            <DataProviderComponent url={process.env.PUBLIC_URL + url} onDataProvided={(data) => {
                 const taskSuggester = new TaskSuggester(data);
                 taskSuggester.setSelectedRuleIdxs(selectedRuleIdxs);
                 setCurrentTask(taskSuggester.suggestNextTask());
                 setTaskSuggester(taskSuggester);
            }}
            />

            {taskSuggester 
                ? <FilterLinkComponent 
                        selectedRuleIdxs={selectedRuleIdxs} 
                        topics={taskSuggester.getTopics()} 
                        isActive={isFilterScreen()}
                        onClicked={() => {
                            history.push(buildPath(selectedRuleIdxs, 'filter'))
                        }}
                    />
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
                ? <div><BodyQuestionAnswerComponent key={questionCounter} data = {task.bodyChunk} onAnswered={
                    (isCorrect) => {
                        taskSuggester!.recordAnswer(task.taskIdx, isCorrect);
                        setIsAnswered(true);
                    }
                } /></div>
                : null
            }
            {isAnswered
                ? <button onClick={() => {
                    setCurrentTask(taskSuggester!.suggestNextTask());
                    setIsAnswered(false);
                    setQuestionCounter(questionCounter + 1);
                }}>Next</button>
                : null
            }
    </div> ;
}