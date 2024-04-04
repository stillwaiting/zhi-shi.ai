import { MarkdownBodyChunkConnection, MarkdownNode, isMarkdownBodyChunkConnection } from './types';
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

const cachedRegex: {[key: string]: RegExp} = {};

function escapeRegex(string: string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

function insertVariables(body: string, variables: { [name: string]: string}): string {
    const randomStr1 = "" + Math.random() + "" + new Date().getTime();
    const randomStr2 = "" + Math.random() + "" + new Date().getTime();
    body = body.replaceAll("\\{", randomStr1);
    body = body.replaceAll("\\}", randomStr2);
    Object.keys(variables).forEach(key => {
        const regexStr = "\\{" + escapeRegex(key) + "(\\|.*?){0,}\\}";
        const re = cachedRegex[key] ? cachedRegex[key] : new RegExp(regexStr, "g");
        cachedRegex[key] = re;

        const matches = body.matchAll(re);
        do {
            const next = matches.next();
            if (next && next.value) {
                const fullMatchSubstr = next.value[0];
                const argsplit = fullMatchSubstr.substr(1, fullMatchSubstr.length - 2).split('|');
                let replacement = variables[key].trim();
                for (let idx = 0; idx < argsplit.length; idx++) {
                    const arg = argsplit[idx];
                    replacement = replacement.replaceAll("$" + idx, arg);
                }
                body = body.replaceAll(fullMatchSubstr, replacement);
            } else {
                break;
            }
        } while (true);

        // body = body.replaceAll("{" + key + "}", variables[key].trim());
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

export interface ParseResult {
    parsedNodes: Array<MarkdownNode>;
    indexedNodes: Record<string, MarkdownNode>;
    errors: Array<string>;
}
  
function indexNodesByTitle(nodes: Array<MarkdownNode>, result: Record<string, MarkdownNode>, errors: Array<string>) {
    nodes.forEach(node => {
        if (result[node.title]) {
            errors.push("Node with duplicated title: " + node.title);
        } else {
            result[node.title] = node;
        }
        indexNodesByTitle(node.children, result, errors);
    });
}

function validateAndPopulateMissingConnections(nodes: Record<string, MarkdownNode>, errors: Array<string>) {
    Object.keys(nodes).forEach(nodeTitle => {
        const node = nodes[nodeTitle];
        node.body.content
            .filter(isMarkdownBodyChunkConnection)
            .filter(content => !content.isAutogenerated)
            .forEach(content => {
                const connectedNode = nodes[content.connectedNodeTitle];
                if (connectedNode) {
                    const alreadyHas = connectedNode.body.content.find(content => 
                        isMarkdownBodyChunkConnection(content) && content.connectedNodeTitle === nodeTitle);
                    if (alreadyHas) {
                        // nothing to do
                    } else {
                        const reciprocalConnection: MarkdownBodyChunkConnection = {
                            connectedNodeTitle: nodeTitle,
                            isAutogenerated: true
                        };
                        connectedNode.body.content.push(reciprocalConnection);
                    }
                } else {
                    errors.push(`Cannot find connected node ${content.connectedNodeTitle} for ${nodeTitle}`);
                }
            });
    });
}


export default (mdString: string, parentPath: Array<String>): ParseResult => {
    mdString = removeComments(mdString.trim());

    if (mdString.length == 0) {
        return {
            parsedNodes: [],
            errors: [],
            indexedNodes: {}
        }
    }

    if (mdString[0] != '#') {
        throw "must start with #"
    }

    const separator = readAllSharpsFromStart(mdString);

    const chunks = ("\n" + mdString).split("\n" + separator + " ");
    chunks.shift();

    const indexedNodes: Record<string, MarkdownNode> = {};
    const errors: Array<string> = [];
    const parsedNodes = chunks.map(chunk => parseChunk(chunk, parentPath));

    indexNodesByTitle(parsedNodes, indexedNodes, errors);

    validateAndPopulateMissingConnections(indexedNodes, errors);

    return {
        parsedNodes,
        errors,
        indexedNodes
    };

}
