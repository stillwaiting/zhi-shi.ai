export interface MarkdownBody {
    content: string;
}

export interface MarkdownNode {
    title: string;
    body: MarkdownBody;
    path: Array<string>;
    children: Array<MarkdownNode>;
}

function readAllSharpsFromStart(s: string) {
    let sharps = "";
    let pos = 0;
    while (pos < s.length && s[pos] == '#') {
        sharps += '#';
        pos ++;
    }
    return sharps;
}

function parseChunk(chunk: string, parentPath: Array<String>): MarkdownNode {
    const split = (chunk.trim() + "\n").split("\n");
    const title = split[0];
    const body = split.slice(1).join("\n").trim();
    const path = Object.assign([], parentPath);
    path.push(title.trim());

    if (body.indexOf("\n#") >= 0 || body.startsWith("#")) {
        const childrenStartAt = body.indexOf("\n#");
        const childrenStr = body.substr(childrenStartAt+1);
        const childrenSharps = readAllSharpsFromStart(childrenStr);
        const childChunks = ("\n" + childrenStr).split("\n" + childrenSharps + " ");
        childChunks.shift();
        return {
            title: title.trim(),
            path: path,
            body: {
                content: body.substr(0, childrenStartAt).trim()
            },
            children: childChunks.map(chunk => parseChunk(chunk, path))
        }
    } else {
        return {
            title: title.trim(),
            path: path,
            body: {
                content: body.trim()
            },
            children: []
        }
    }
}


export default (mdString: string, parentPath: Array<String>): Array<MarkdownNode> => {
    mdString = mdString.trim();

    if (mdString.length == 0) {
        return [];
    }

    if (mdString[0] != '#') {
        throw "must start with #"
    }

    const separator = readAllSharpsFromStart(mdString);

    const chunks = ("\n" + mdString).split("\n" + separator + " ");
    chunks.shift();

    return chunks.map(chunk => parseChunk(chunk, parentPath))
}