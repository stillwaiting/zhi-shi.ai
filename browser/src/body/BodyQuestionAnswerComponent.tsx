import React, { useContext, useEffect, useState } from 'react'
import { MarkdownBodyChunkQuestionAnswers, MarkdownBodyChunkTextParagraph } from '../md/types'
import BodyTextParagraphComponent from './BodyTextParagraphComponent'

import BodyQuestionComponent from './BodyQuestionComponent'

import AppContext from '../AppContext';

type SentenceWithAnswers = {
    data: MarkdownBodyChunkQuestionAnswers
}

const RED_CROSS = <img className="error" src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAA3NCSVQICAjb4U/gAAAACXBIWXMAAAjFAAAIxQEgMaV3AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAAt0RVh0VGl0bGUARXJyb3KmAto4AAAADHRFWHRBdXRob3IAbHBlbnoMVi/xAAAAIXRFWHRDcmVhdGlvbiBUaW1lADIwMTItMDgtMDFUMTk6NDM6MjCCecQvAAAAQnRFWHRTb3VyY2UAaHR0cHM6Ly9vcGVuY2xpcGFydC5vcmcvZGV0YWlsLzE3MTM5MC9lcnJvci1ieS1scGVuei0xNzEzOTC80y2ZAAAAWHRFWHRDb3B5cmlnaHQAQ0MwIFB1YmxpYyBEb21haW4gRGVkaWNhdGlvbiBodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9wdWJsaWNkb21haW4vemVyby8xLjAvxuO9+QAAAFdQTFRFAAAAAAAAAAAAIQAAIAAAIwAAIQAAIgAAJgAAJAAAJQAAJAAAJwAAJwAAIQAAJAAAJgAAigAAiwAAiwAAkgAAjAAAywAAzwAA0AAA1gAA0AAA0QAA/wAADRPQ0gAAABx0Uk5TAAoMhIiKjI3Fx8fIycrLy8zt7e7u7/z8/Pz9/XWh3NgAAAFtSURBVFjDpZfZUsMwDEUdaNyyBQqlLYn//ztpdi/StWzp1XPOZDL2lWRMWG3XGFBN1xpYz+e/jyfAn+6XI+adG75YQ/N2dQ4ZRh4YJh4ZZp41LDxvWHnGsPGcYedJg8fTBp8nDAFPGUI+MUR8aoj5yJDwsSHlAwPBhwaK9wwk7xtofjMw/G7g+MXA8quB5ycD4GfD4duB6t9fb+j8tzXd4KChh8dDZ+An5ir3k0S8wpC7KGK+0pB7LEV8haFPAuPlquILDf0nFZpyA8kXGBhebGB5oQHwIgPkHwb8/MeAgO1fLRBcSND9hRc6Nz8oDOIHlZsfKg1FDzo3P1QYigNFG0j6SNSHsr4t6BvT2hpP9/rmOk7m6vauGzB+WjziPPILptzF4iFpyj9gmHnesOQna1h5zrDlL2PYedrg5Tdp8HnKEOQ/YQh5YtwP+0diiPnihcMqVx6rXLqscu2zysXTKldfi5fnXPPEfMX6/w+D8BH1dVpAtgAAAABJRU5ErkJggg==' width='32' />
const GREEN_TICK = <img className="success" src='data:image/png;base64,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' width='32' />

function renderAnswers(nodeTitle: string, answers: Array<MarkdownBodyChunkTextParagraph>, dropdownIndices: number[])  {
    let titleAnchor = '';
    if (nodeTitle.indexOf('::') >= 0 && nodeTitle.indexOf('!') >= 0) {
        titleAnchor = nodeTitle.split('::')[1];
    }

    return <table><tbody>{dropdownIndices.map((dropdownIndex, idx) => {
        if (answers[idx]) {
            const body:MarkdownBodyChunkTextParagraph = {
                text: answers[idx].text
            }

            if (titleAnchor) {
                body.text += ' [Details](..#' + titleAnchor + ').';
            }

            return <tr key={"answer_" + idx} className="answer">
                <td>({idx+1})</td>
                <td>{dropdownIndex == 0 ? GREEN_TICK : RED_CROSS}</td>
                <td><BodyTextParagraphComponent data={body} /></td>
            </tr>
        } else {
            return <span>Error, no answer</span>;
        }
    })}</tbody></table>;
}

export default ( {data }: SentenceWithAnswers) => {
    const context = useContext(AppContext);
    const [dropdownIndices, setSubmittedDropdownIndices] = useState<Array<number>>([])
    useEffect(() =>
        setSubmittedDropdownIndices([])
    , [data.question.text, data.answers.length]);
    return <div key={Math.random()}>
        <div><BodyQuestionComponent question={data.question.text} onSubmit={(indices) => setSubmittedDropdownIndices(indices)} indices={dropdownIndices}/></div>
        {dropdownIndices.length > 0 ? renderAnswers(context.currentNodeTitle, data.answers, dropdownIndices) : null}
    </div>
}
