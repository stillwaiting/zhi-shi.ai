import React, { useEffect } from "react";
import { useState } from "react";
import BodyQuestionAnswerComponent, { Context } from "../body/BodyQuestionAnswerComponent";
import BrowserWarningComponent from "./BrowserWarningComponent";
import DataProviderComponent from "./DataProviderComponent";
import TaskSuggester, { TaskType } from "./TaskSuggester";
import { BrowserRouter as Router, Route, Link, useHistory, useLocation } from "react-router-dom";
import { extractSelectedRulIdxsFromPath } from "./pathutils";

export default function({ url }: { url:string }) {
    const location = useLocation();
    const [task, setCurrentTask] = useState<TaskType | null>(null);
    const [isAnswered, setIsAnswered] = useState<boolean>(false);
    const [taskSuggester, setTaskSuggester] = useState<TaskSuggester | null>(null);
    const [questionCounter, setQuestionCounter] = useState<number>(0);
    const [selectedRuleIdxs, setSelectedRuleIdxs] = useState<Array<number>>(extractSelectedRulIdxsFromPath(location.pathname));

    const history = useHistory();

    useEffect(() => {
        const newSelectedRules = extractSelectedRulIdxsFromPath(location.pathname);
        setSelectedRuleIdxs(extractSelectedRulIdxsFromPath(location.pathname));
        if (taskSuggester) {
            taskSuggester.setSelectedRuleIdxs(newSelectedRules);
            if (!taskSuggester.isTaskInSelectedRules(task!.taskIdx)) {
                setCurrentTask(taskSuggester.suggestNextTask());
            }
        }
    }, [location.pathname, task, taskSuggester, history]);
    
    return <div className='TrainerComponent'>
            <BrowserWarningComponent />
            <DataProviderComponent url={process.env.PUBLIC_URL + url} onDataProvided={(data) => {
                 const taskSuggester = new TaskSuggester(data);
                 taskSuggester.setSelectedRuleIdxs(selectedRuleIdxs);
                 setCurrentTask(taskSuggester.suggestNextTask());
                 setTaskSuggester(taskSuggester);
            }}
                 />
            {!!task 
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