export interface MarkdownBodyChunk {
}
export const isMarkdownBodyChunk = (obj: any): obj is MarkdownBodyChunk => {
    return typeof obj === 'object';
}
export interface MarkdownBodyChunkTextParagraph extends MarkdownBodyChunk {
    text: string;
}
export const isMarkdownBodyChunkTextParagraph = (obj: any): obj is MarkdownBodyChunkTextParagraph => {
    const castObj = isMarkdownBodyChunk(obj) ? obj : null;
    return !!castObj && obj.text !== undefined;
}

export interface MarkdownBodyChunkList extends MarkdownBodyChunk {
    start: string,
    isOrdered: boolean,
    items: Array<MarkdownBody>;
}
export const isMarkdownBodyChunkList = (obj: any): obj is MarkdownBodyChunkList => {
    const castObj = isMarkdownBodyChunk(obj) ? obj : null;
    return !!castObj && obj.items !== undefined && obj.start !== undefined;
}

export interface MarkdownTableCell {
    rowSpan: number;
    colSpan: number;
    content: MarkdownBody;
}

export interface MarkdownTableRow {
    cells: Array<MarkdownTableCell>;
}

export interface MarkdownBodyChunkTable extends MarkdownBodyChunk {
    rows: Array<MarkdownTableRow>
}
export const isMarkdownBodyChunkTable = (obj: any): obj is MarkdownBodyChunkTable => {
    const castObj = isMarkdownBodyChunk(obj) ? obj : null;
    return !!castObj && obj.rows !== undefined;
}

export interface MarkdownBodyChunkQuestionAnswers extends MarkdownBodyChunk {
    question: MarkdownBodyChunkTextParagraph,
    answers: Array<MarkdownBodyChunkTextParagraph>
}
export const isMarkdownBodyChunkQuestionAnswers = (obj: any): obj is MarkdownBodyChunkQuestionAnswers => {
    const castObj = isMarkdownBodyChunk(obj) ? obj : null;
    return !!castObj && obj.question !== undefined;
}

export interface MarkdownBodyChunkConnection extends MarkdownBodyChunk {
    connectedNodeTitle: string;
}

export const isMarkdownBodyChunkConnection = (obj: any): obj is MarkdownBodyChunkConnection => {
    const castObj = isMarkdownBodyChunk(obj) ? obj : null;
    return !!castObj && obj.connectedNodeTitle !== undefined;
}

export interface MarkdownBody {
    content: Array<MarkdownBodyChunk>;
}

export interface MarkdownNode {
    title: string;

    body: MarkdownBody;
    nodeTemplateVariables: { [name: string]: string };

    path: Array<string>;

    children: Array<MarkdownNode>;
    childrenByTitleIndex:  { [key: string]: number };
}