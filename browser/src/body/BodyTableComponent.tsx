import { getNodeText } from '@testing-library/dom';
import React, { useState } from 'react';
import './BodyTableComponent.scss';
import BodyComponent from './BodyComponent';

import { isMarkdownBodyChunkTextParagraph, MarkdownBody, MarkdownBodyChunkList, MarkdownBodyChunkTable, MarkdownBodyChunkTextParagraph, MarkdownNode } from '../md/types';

type BodyTableComponent = {
    data: MarkdownBodyChunkTable
};

export default ( { data }: BodyTableComponent ) => {
    return <table className='BodyTableComponent'><tbody>
        {data.rows.map((row, rowIdx) => 
            <tr key={`tr${rowIdx}`}>
                {row.cells.map((cell, cellIdx) => 
                    <td key={`td${cellIdx}`} colSpan={cell.colSpan} rowSpan={cell.rowSpan}><BodyComponent 
                            body={cell.content} 
                    /></td>
                )}
            </tr>
        )}
    </tbody></table>;
}



