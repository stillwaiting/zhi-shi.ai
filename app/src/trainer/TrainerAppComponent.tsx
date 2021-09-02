import React from "react";
import { useState } from "react";
import BodyQuestionAnswerComponent, { Context } from "../body/BodyQuestionAnswerComponent";
import BrowserWarningComponent from "./BrowserWarningComponent";
import DataProviderComponent from "./DataProviderComponent";
import TaskSuggester, { TaskType } from "./TaskSuggester";

let taskSuggester: TaskSuggester | undefined = undefined;

export default function({ url }: { url:string }) {
    const [task, setCurrentTask] = useState<TaskType | null>(null);
    return <div className='TrainerComponent'>
            <BrowserWarningComponent />
            <DataProviderComponent url={process.env.PUBLIC_URL + url} onDataProvided={(data) => {
                 taskSuggester = new TaskSuggester(data);
                 setCurrentTask(taskSuggester.suggestNextTask());
            }}
                 />
            {!!task 
                ? <div><BodyQuestionAnswerComponent data = {task.bodyChunk} /></div>
                : null
            }
    </div> ;
}