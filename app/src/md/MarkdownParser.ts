import { MarkdownNode } from './types';
import parseBody from './MarkdownBodyParser';

function readAllSharpsFromStart(s: string) {
    let sharps = "";
    let pos = 0;
    while (pos < s.length && s[pos] == '#') {
        sharps += '#';
        pos ++;
    }
    return sharps;
}

const PROCESS_TEMPLATE_REGEXP = /{set:(.*?)}((.|[\r\n])*?){\/set}/g

/**
 * Moves constructions like
 *      {set:blah}
 *          foo
 *      {/set}
 * to variables.
 * 
 */
function extractNewVariables(body: string): [string, { [name: string]: string }] {
    const matches = body.matchAll(PROCESS_TEMPLATE_REGEXP);
    const replacements: { [key: string]: string } = {};
    do {
        const next = matches.next();
        if (next && next.value) {
            replacements[next.value[1]] = next.value[2];
        } else {
            break;
        }
    } while (true);
    body = body.replaceAll(PROCESS_TEMPLATE_REGEXP, '');
    const variables: { [name: string]: string } = {};
    Object.keys(replacements).forEach(key => {
        variables[key] = replacements[key];
    });
    return [body, variables];
}

/**
 * "abc {foo} def" -> {foo: bar} -> "abs bar def"
 * 
 */
function insertVariables(body: string, variables: { [name: string]: string}): string {
    const randomStr1 = "" + Math.random() + "" + new Date().getTime();
    const randomStr2 = "" + Math.random() + "" + new Date().getTime();
    body = body.replaceAll("\\{", randomStr1);
    body = body.replaceAll("\\}", randomStr2);
    Object.keys(variables).forEach(key => {
        body = body.replaceAll("{" + key + "}", variables[key].trim());
    });
    body = body.replaceAll(randomStr1, "\\{");
    body = body.replaceAll(randomStr2, "\\}");
    return body;
}

function addNewVars(nodeVars: { [name: string]: string; }, newVars: { [name: string]: string; }) {
    Object.keys(newVars).forEach(varName => {
        nodeVars[varName] = newVars[varName];
    });
    Object.keys(newVars).forEach(newVarName => {
        if (nodeVars[newVarName].indexOf('{') >= 0) {
            nodeVars[newVarName] = insertVariables(nodeVars[newVarName], nodeVars);
        }
    });
}

function parseChunk(chunk: string, parentPath: Array<String>, parentNodeVariables: {[name: string]: string} = {}): MarkdownNode {
    const split = (chunk.trim() + "\n").split("\n");
    const title = split[0];
    const body = split.slice(1).join("\n").trim();

    const path = Object.assign([], parentPath);
    path.push(title.trim());

    const nodeVars = JSON.parse(JSON.stringify(parentNodeVariables));

    if (body.indexOf("\n#") >= 0 || body.startsWith("#")) {
        const childrenStartAt = body.startsWith("#") ?  0 : body.indexOf("\n#") + 1;
        const childrenStr = body.substr(childrenStartAt);
        const childrenSharps = readAllSharpsFromStart(childrenStr);
        const childChunks = ("\n" + childrenStr).split("\n" + childrenSharps + " ");

        const bodyWithoutChildren = body.substr(0, childrenStartAt).trim();
        const [bodyNoNewVars, newVars] = extractNewVariables(bodyWithoutChildren);

        addNewVars(nodeVars, newVars);

        const processedBody = insertVariables(bodyNoNewVars, nodeVars);

        childChunks.shift();
        const newNode: MarkdownNode = {
            title: title.trim(),
            path: path,
            body: parseBody(processedBody),
            nodeTemplateVariables: nodeVars,
            children: childChunks.map(chunk => parseChunk(chunk, path, nodeVars)),
            childrenByTitleIndex: {},
        };
        newNode.childrenByTitleIndex = newNode.children.reduce((index: { [key:string]: number }, childNode, idx) => {
            index[childNode.title] = idx;
            return index;
        }, {});
        return newNode;
    } else {
        let [processedBody, newVars] = extractNewVariables(body);

        addNewVars(nodeVars, newVars);

        processedBody = insertVariables(processedBody, nodeVars);

        return {
            title: title.trim(),
            path: path,
            body: parseBody(processedBody.trim()),
            nodeTemplateVariables: nodeVars,
            children: [],
            childrenByTitleIndex: {}
        };
    }
}

function removeComments(s: string): string {
    if (s) {
      return s.replaceAll(/\/\*(.|\n)*?\*\//g, '');
    }
    return s;
}  


export default (mdString: string, parentPath: Array<String>): Array<MarkdownNode> => {
    mdString = removeComments(mdString.trim());

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
