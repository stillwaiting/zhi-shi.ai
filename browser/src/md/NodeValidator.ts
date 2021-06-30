export interface MarkdownNodeError {
}

// Links - must be correct
// Titles - must not contain special characters "*", "_", "<", ">"
// TItles - must be unique

export interface TwoOrMoreNodesHaveSameTitleError extends MarkdownNodeError {
    title: string,
    paths: Array<Array<string>>
}

function isTwoOrMoreNodesHaveSameTitleError(obj: any): obj is TwoOrMoreNodesHaveSameTitleError {
    return !!obj.title && !!obj.childrenIndices;
}