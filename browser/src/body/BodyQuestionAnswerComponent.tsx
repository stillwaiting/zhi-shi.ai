import React, { useState } from 'react'
import { MarkdownBodyChunkQuestionAnswers, MarkdownBodyChunkTextParagraph } from '../md/types'
import BodyTextParagraphComponent from './BodyTextParagraphComponent'

import BodyQuestionComponent from './BodyQuestionComponent'

type SentenceWithAnswers = {
    data: MarkdownBodyChunkQuestionAnswers,
    onLinkClicked: (link: string) => void
}

const RED_CROSS = <img className="error" src='https://images2.imgbox.com/29/91/c4KeBiML_o.png' width='32' />
const GREEN_TICK = <img className="success" src='https://images2.imgbox.com/7e/a3/Aiizr6oe_o.png' width='32' />

function renderAnswers(answers: Array<MarkdownBodyChunkTextParagraph>, dropdownIndices: number[], onLinkClicked: (link: string) => void)  {
    return <table><tbody>{dropdownIndices.map((dropdownIndex, idx) => {
        return <tr key={"answer_" + idx} className="answer">
            <td>({idx+1})</td>
            <td>{dropdownIndex == 0 ? GREEN_TICK : RED_CROSS}</td>
            <td><BodyTextParagraphComponent data={answers[idx]} onLinkClicked={onLinkClicked} /></td>
        </tr>
    })}</tbody></table>;
}

export default ( {data, onLinkClicked}: SentenceWithAnswers) => {
    const [dropdownIndices, setSubmittedDropdownIndices] = useState<Array<number>>([])

    return <div>
        <div><BodyQuestionComponent question={data.question.text} onSubmit={(indices) => setSubmittedDropdownIndices(indices)} /></div>
        {dropdownIndices.length > 0 ? renderAnswers(data.answers, dropdownIndices, onLinkClicked) : null}
        <div style={{visibility: 'hidden'}}>
            {RED_CROSS}
            {GREEN_TICK}
        </div>
    </div>
}
