export interface MarkdownNodeError {
}

export interface TwoOrMoreNodesHaveSameTitleError extends MarkdownNode {
    title: string,
    paths: Array<Array<string>>
}
