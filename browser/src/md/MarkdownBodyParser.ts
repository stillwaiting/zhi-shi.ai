import { MarkdownBody, MarkdownBodyChunkList, MarkdownBodyChunkQuestionAnswers, MarkdownBodyChunkTable, MarkdownBodyChunkTextParagraph } from "./types"

function isBeginningOfTable(line: string) {
    return (line.trim().length > 0 && line.trim()[0] === '|');
}

function findEndOfTable(lines: Array<string>, fromLineIdx: number) {
    let currLine = fromLineIdx;
    do {
        currLine ++;
    } while (currLine < lines.length && (lines[currLine].trim().startsWith('|') || lines[currLine].trim().startsWith('-')));
    return currLine;
}

function parseRowSpan(line: string): number {
    if (line.startsWith("cols=") || line.startsWith("rows=")) {
        const split = line.split("rows=", 2);
        return parseInt(split[1]);
    }
    return 1;
}

function parseColSpan(line: string): number {
    if (line.startsWith("cols=") || line.startsWith("rows=")) {
        const split = line.split("cols=", 2);
        return parseInt(split[1]);
    }
    return 1;
}

function skipSpans(line: string): string {
    if (line.startsWith("cols=") || line.startsWith("rows=")) {
        const split = line.split("\n", 2);
        if (split.length > 1) {
            return split[1];
        }
    }
    return line;
}

function parseTable(lines: Array<string>, currLine: number, lineAfterTable: number) {
    let rowTexts: Array<string> = [];
    const parsedTable: MarkdownBodyChunkTable = {
        rows: []
    };
    for (let lineIdx = currLine; lineIdx < lineAfterTable; lineIdx++) {
        const trimmedLine = lines[lineIdx].trim();
        if (trimmedLine.startsWith('|-') || trimmedLine.startsWith('| --') || trimmedLine.startsWith('-')) {
            parsedTable.rows.push({
                cells: rowTexts.map(cellText => ({
                    rowSpan: parseRowSpan(cellText),
                    colSpan: parseColSpan(cellText),
                    content: parseBody(skipSpans(cellText))
                }))
            });
            rowTexts = [];
        } else {
            let split = trimmedLine.split('|');
            split = split.slice(1);
            if (rowTexts.length == 0) {
                rowTexts = split.map(str => str.trim());
            } else {
                for (let splitIdx = 0; splitIdx < split.length; splitIdx++) {
                    if (splitIdx < rowTexts.length) {
                        rowTexts[splitIdx] += '\n' + split[splitIdx].trim();
                    } else {
                        rowTexts.push(split[splitIdx].trim());
                    }
                }
            }
        }
    }
    if (rowTexts.length > 0) {
        parsedTable.rows.push({
            cells: rowTexts.map(cellText => ({
                rowSpan: parseRowSpan(cellText),
                colSpan: parseColSpan(cellText),
                content: parseBody(skipSpans(cellText))
            }))
        });
    }
    return parsedTable;
}

function isBeginningOfParagraph(line: string) {
    return (line.trim().length > 0 && !isBeginningOfList(line) && !isBeginningOfTable(line)) && !isBeginningOfQuestionAnswers(line);
}

function findEndOfParagraph(lines: Array<string>, fromLineIdx: number) {
    let currentLine = fromLineIdx;
    do {
        currentLine += 1;
    } while (currentLine < lines.length && isBeginningOfParagraph(lines[currentLine]));
    return currentLine;
}

function parseParagraph(lines: Array<string>, fromLineIdx: number, lineAfterIdx: number): MarkdownBodyChunkTextParagraph {
    const parsedParagraph: MarkdownBodyChunkTextParagraph = {
        text: ''
    }

    for (let currLine = fromLineIdx; currLine < lineAfterIdx; currLine ++) {
        if (parsedParagraph.text.length == 0) {
            parsedParagraph.text = lines[currLine].trim();
        } else {
            parsedParagraph.text += ' ' + lines[currLine].trim();
        }
    }
    return parsedParagraph;
}

function isNumber(str: string) {
    return str === ('' + parseInt(str))
}

function isOrderedList(line: string): boolean {
    const trimmedLine = line.trim();

    const split = trimmedLine.split('. ');
    if (split.length == 1) {
        return false;
    }
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

function isBeginningOfList(line: string) {
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

function isBeginningOfQuestionAnswers(line: string) {
    return line.trim().startsWith('?');
}

function findEndOfQuestionAnswers(lines: Array<string>, fromLineIdx: number) {
    let currLine = fromLineIdx;
    do {
        currLine ++;
    } while (currLine < lines.length && (lines[currLine].trim().startsWith('?') || lines[currLine].trim().startsWith('!')));
    return currLine;
}

function parseQuestionsAnswers(lines: Array<string>, startFromLineIdx: number, untilLineIdx: number): MarkdownBodyChunkQuestionAnswers {
    const parsedQuestionAnswers: MarkdownBodyChunkQuestionAnswers = {
        question: {
            text: ''
        },
        answers: []
    };
    let nextItemLines: Array<string> = [];
    for (let lineIdx = startFromLineIdx; lineIdx < untilLineIdx; lineIdx ++ ) {
        if (lineIdx == startFromLineIdx) {
            parsedQuestionAnswers.question = parseParagraph([lines[lineIdx].trim().substr(1)], 0, 1);
            continue;
        }

        parsedQuestionAnswers.answers.push(parseParagraph([lines[lineIdx].trim().substr(1)], 0, 1));
    }
    return parsedQuestionAnswers;
}

function parseBody(markdownRawBody: string): MarkdownBody {
    const parsedBody: MarkdownBody = {
        content: []
    };

    const lines = markdownRawBody.trim().split("\n");

    let currLine = 0;
    while (currLine < lines.length) {
        if (isBeginningOfParagraph(lines[currLine])) {
            const lineAfterParagraph = findEndOfParagraph(lines, currLine);
            parsedBody.content.push(parseParagraph(lines, currLine, lineAfterParagraph));
            currLine = lineAfterParagraph;
            continue;
        }

        if (isBeginningOfList(lines[currLine])) {
            const lineAfterList = findEndOfList(lines, currLine);
            parsedBody.content.push(parseList(lines, currLine, lineAfterList));
            currLine = lineAfterList;
            continue;
        }

        if (isBeginningOfTable(lines[currLine])) {
            const lineAfterTable = findEndOfTable(lines, currLine);
            parsedBody.content.push(parseTable(lines, currLine, lineAfterTable));
            currLine = lineAfterTable;
            continue;
        }

        if (isBeginningOfQuestionAnswers(lines[currLine])) {
            const lineAfterTable = findEndOfQuestionAnswers(lines, currLine);
            parsedBody.content.push(parseQuestionsAnswers(lines, currLine, lineAfterTable));
            currLine = lineAfterTable;
            continue;
        }

        currLine += 1;
    }
    return parsedBody;
}

export default parseBody;