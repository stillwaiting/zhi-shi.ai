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

export interface MarkdownBodyParagraph {
    rawLines: Array<string>;

    chunks: Array<MarkdownBodyChunk>;
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