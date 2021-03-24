import React, { useState } from 'react'

import SentenceComponent from './SentenceComponent'

type SentenceWithAnswers = {
    sentence: string,
    answers: Array<string>
}

const RED_CROSS = <img className="error" src='https://images2.imgbox.com/29/91/c4KeBiML_o.png' width='32' />
const GREEN_TICK = <img className="success" src='https://images2.imgbox.com/7e/a3/Aiizr6oe_o.png' width='32' />

function renderAnswers(answers: Array<String>, dropdownIndices: number[])  {
    return dropdownIndices.map((dropdownIndex, idx) => {
        return <div key={"answer_" + idx} className="answer">
            ({idx+1})
            {dropdownIndex == 0 ? GREEN_TICK : RED_CROSS}
            {answers[idx]}
        </div>
    });
}

export default ( {sentence, answers}: SentenceWithAnswers) => {
    const [dropdownIndices, setSubmittedDropdownIndices] = useState<Array<number>>([])

    return <div>
        <div><SentenceComponent sentence={sentence} onSubmit={(indices) => setSubmittedDropdownIndices(indices)} isAnswerMode={dropdownIndices.length > 0} /></div>
        {dropdownIndices.length > 0 ? renderAnswers(answers, dropdownIndices) : null}
        <div style={{visibility: 'hidden'}}>
            {RED_CROSS}
            {GREEN_TICK}
        </div>
    </div>
}
