import { MarkdownBody } from "./types"

export default (markdownRawBody: string): MarkdownBody => {
    return {
        content: [
            {
                rawLines: markdownRawBody.split("\n"),
                chunks: []
            }
        ]
    };
}