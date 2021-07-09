import React, { useEffect, useState } from 'react'
import { MarkdownBodyChunkQuestionAnswers, MarkdownBodyChunkTextParagraph } from '../md/types'
import BodyTextParagraphComponent from './BodyTextParagraphComponent'

import BodyQuestionComponent from './BodyQuestionComponent'

type SentenceWithAnswers = {
    data: MarkdownBodyChunkQuestionAnswers
}

const RED_CROSS = <img className="error" src='https://images2.imgbox.com/29/91/c4KeBiML_o.png' width='32' />
const GREEN_TICK = <img className="success" src='https://images2.imgbox.com/7e/a3/Aiizr6oe_o.png' width='32' />

function renderAnswers(answers: Array<MarkdownBodyChunkTextParagraph>, dropdownIndices: number[])  {
    return <table><tbody>{dropdownIndices.map((dropdownIndex, idx) => {
        if (answers[idx]) {
            return <tr key={"answer_" + idx} className="answer">
                <td>({idx+1})</td>
                <td>{dropdownIndex == 0 ? GREEN_TICK : RED_CROSS}</td>
                <td><BodyTextParagraphComponent data={answers[idx]} /></td>
            </tr>
        } else {
            return <span>Error, no answer</span>;
        }
    })}</tbody></table>;
}

export default ( {data}: SentenceWithAnswers) => {
    const [dropdownIndices, setSubmittedDropdownIndices] = useState<Array<number>>([])
    useEffect(() =>
        setSubmittedDropdownIndices([])
    , [data.question.text, data.answers.length]);
    return <div>
        <div><BodyQuestionComponent question={data.question.text} onSubmit={(indices) => setSubmittedDropdownIndices(indices)} indices={dropdownIndices}/></div>
        {dropdownIndices.length > 0 ? renderAnswers(data.answers, dropdownIndices) : null}
        <div style={{visibility: 'hidden'}}>
            {RED_CROSS}
            {GREEN_TICK}
        </div>
    </div>
}
