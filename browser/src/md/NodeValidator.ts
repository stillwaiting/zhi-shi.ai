export interface MarkdownNodeError {
}

export interface TwoOrMoreNodesHaveSameTitleError extends MarkdownNodeError {
    title: string,
    paths: Array<Array<string>>
}

function isTwoOrMoreNodesHaveSameTitleError(obj: any): obj is TwoOrMoreNodesHaveSameTitleError {
    return !!obj.title && !!obj.childrenIndices;
}