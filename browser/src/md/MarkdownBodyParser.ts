import { MarkdownBody, MarkdownBodyParagraph } from "./types"

export default (markdownRawBody: string): MarkdownBody => {
    const lines = markdownRawBody.trim().split("\n")

    const parsed: Array<MarkdownBodyParagraph> = [];

    let currentParagraph: MarkdownBodyParagraph | null = null;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx ++) {
        const line = lines[lineIdx];
        if (line.trim().length == 0) {
            if (currentParagraph) {
                parsed.push(currentParagraph);
                currentParagraph = null;
            }
            continue;
        }
        if (currentParagraph) {
            currentParagraph!.rawLines.push(line);
        } else {
            currentParagraph = {
                rawLines: [line],
                chunks: []
            }
        }
    }

    if (currentParagraph) {
        parsed.push(currentParagraph);
        currentParagraph = null;
    }

    return {
        content: parsed
    };
}