import { MarkdownBody, MarkdownBodyChunkList, MarkdownBodyChunkTextParagraph } from "./types"

function beginningOfTable(line: string) {
    // TODO
    return false;
}

function beginningOfParagraph(line: string) {
    return (line.trim().length > 0 && !beginningOfList(line) && !beginningOfTable(line));
}

function findEndOfParagraph(lines: Array<string>, fromLineIdx: number) {
    let currentLine = fromLineIdx;
    do {
        currentLine += 1;
    } while (currentLine < lines.length && beginningOfParagraph(lines[currentLine]));
    return currentLine;
}

function parseParagraph(lines: Array<string>, fromLineIdx: number, lineAfterIdx: number): MarkdownBodyChunkTextParagraph {
    const parsedParagraph: MarkdownBodyChunkTextParagraph = {
        text: []
    }
    let mergedText = '';

    for (let currLine = fromLineIdx; currLine < lineAfterIdx; currLine ++) {
        if (mergedText.length == 0) {
            mergedText = lines[currLine].trim();
        } else {
            mergedText += ' ' + lines[currLine].trim();
        }
    }
    // TODO: parse (split) inline things (link, bold, italic etc)
    parsedParagraph.text.push(mergedText);
    return parsedParagraph;
}

function isNumber(str: string) {
    return str === ('' + parseInt(str))
}

function isOrderedList(line: string): boolean {
    const trimmedLine = line.trim();

    const split = trimmedLine.split('. ');
    if (split[0].length == 1) {
        return true;
    }
    if (isNumber(split[0])) {
        return true;
    }
    return false;
}

function isUnorderedList(line: string) {
    const trimmedLine = line.trim();
    return trimmedLine.startsWith('- ');
}

function beginningOfList(line: string) {
    return isOrderedList(line) || isUnorderedList(line);
}

function calculateOrderedListPadding(line: string): number {
    return line.split('. ', 2)[0].length + 2;
}

function calculateUnorderedListPadding(line: string): number {
    return line.split('- ', 2)[0].length + 2;
}

function calculateListPadding(line: string): number {
    if (isOrderedList(line)) {
        return calculateOrderedListPadding(line);
    }
    return calculateUnorderedListPadding(line);
}

function getPadding(line: string): number {
    for (let lineIdx = 0; lineIdx < line.length; lineIdx++) {
        if (line[lineIdx] !== ' ') {
            return lineIdx;
        }
    }
    return 0;
}

function getOrderedListStart(line1: string): string {
    return line1.trim().split('. ')[0];
}

function sameListItem(line1: string, line2: string) {
    if (getPadding(line1) != getPadding(line2)) {
        return false;
    }
    if (isUnorderedList(line1) && isUnorderedList(line2)) {
        return line1.trim()[0] == line2.trim()[0];
    }
    if (isOrderedList(line1) && isOrderedList(line2)) {
        const start1 = getOrderedListStart(line1);
        const start2 = getOrderedListStart(line2);

        if (start1.length == start2.length) {
            return true;
        }

        if (isNumber(start1) && isNumber(start2)) {
            return true;
        }
    }
    return false;
}

function findEndOfList(lines: Array<string>, startFromLineIdx: number): number {
    const padding = calculateListPadding(lines[startFromLineIdx]);
    let currentLine = startFromLineIdx;
    do {
        currentLine ++;
    } while (currentLine < lines.length && (getPadding(lines[currentLine]) >= padding || sameListItem(lines[startFromLineIdx], lines[currentLine])));
    return currentLine;
}

function joinAndRemovePadding(lines: Array<string>, padding: number) {
    return lines.map(line => line.substr(padding)).join("\n");
}

function parseList(lines: Array<string>, startFromLineIdx: number, untilLineIdx: number): MarkdownBodyChunkList {
    const isOrdered = isOrderedList(lines[startFromLineIdx]);
    const padding = calculateListPadding(lines[startFromLineIdx]);
    const parsedList: MarkdownBodyChunkList = {
        isOrdered: isOrdered,
        start: isOrdered ? getOrderedListStart(lines[startFromLineIdx]) : lines[startFromLineIdx].trim()[0],
        items: []
    };
    let nextItemLines: Array<string> = [];
    for (let lineIdx = startFromLineIdx; lineIdx < untilLineIdx; lineIdx ++ ) {
        if (sameListItem(lines[startFromLineIdx], lines[lineIdx]) && (nextItemLines.length > 0)) {
            parsedList.items.push(
                parseBody(joinAndRemovePadding(
                    nextItemLines, padding
                ))
            );
            nextItemLines = [];
        }
        nextItemLines.push(lines[lineIdx]);
    }
    if (nextItemLines.length > 0) {
        parsedList.items.push(
            parseBody(joinAndRemovePadding(
                nextItemLines, padding
            ))
        );
        nextItemLines = [];
    }
    return parsedList;
}

function parseBody(markdownRawBody: string): MarkdownBody {
    const parsedBody: MarkdownBody = {
        content: []
    };

    const lines = markdownRawBody.trim().split("\n");

    let currLine = 0;
    while (currLine < lines.length) {
        if (beginningOfParagraph(lines[currLine])) {
            const lineAfterParagraph = findEndOfParagraph(lines, currLine);
            parsedBody.content.push(parseParagraph(lines, currLine, lineAfterParagraph));
            currLine = lineAfterParagraph;
            continue;
        }

        if (beginningOfList(lines[currLine])) {
            const lineAfterList = findEndOfList(lines, currLine);
            parsedBody.content.push(parseList(lines, currLine, lineAfterList));
            currLine = lineAfterList;
            continue;
        }

        // TODO

        // if (beginningOfTable(lines[currLine])) {
        //     const lineAfterTable = findEndOfTable(lines, currLine);
        //     parsedBody.content.push(parseTable(lines, curr, lineAfterTable));
        //     currLine = lineAfterTable;
        //     continue;
        // }

        currLine += 1;
    }
    return parsedBody;
}

export default parseBody;