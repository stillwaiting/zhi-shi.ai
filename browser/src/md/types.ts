export enum MarkdownTextStyle {
    Plain = "plain",
    Bold = "bold",
    Italic = "italic"
}
export interface MarkdownBodyChunk {

}
export interface MarkdownBodyTextChunk extends MarkdownBodyChunk {
    text: string;
    style: MarkdownTextStyle;
}

export const isMarkdownBodyTextChunk = (obj: any): obj is MarkdownBodyTextChunk => {
    return typeof obj === 'object' && obj.text !== undefined && obj.style !== undefined;
}

export interface MarkdownBodyParagraph {
    rawLines: Array<string>;

    chunks: Array<MarkdownBodyChunk>;
}

export const isMarkdownBodyParagraph = (obj: any): obj is MarkdownBodyTextChunk => {
    return typeof obj === 'object' && obj.rawLines !== undefined && obj.chunks !== undefined;
}

export interface MarkdownBody {
    content: Array<MarkdownBodyParagraph>;
}

export interface MarkdownNode {
    title: string;
    body: MarkdownBody;
    path: Array<string>;

    children: Array<MarkdownNode>;
    childrenByTitleIndex:  { [key: string]: number };
}