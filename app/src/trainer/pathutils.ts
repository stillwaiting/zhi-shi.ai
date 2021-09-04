

export function setOfRuleIdxsToPathString(ruleIdxs: Array<number>): string {
    return '';
}

function parseRegion(region: string): Array<number> {
    const [from, to] = region.split('-');
    const ret = [];
    for (let currentIdx = parseInt(from); currentIdx <= parseInt(to); currentIdx ++) {
        ret.push(currentIdx);
    }
    return ret;
}

export function extractSelectedRulIdxsFromPath(path: string): Array<number> {
    const pathSplit = path.split("/").filter(pathChunk => pathChunk.length > 0);
    if (pathSplit.length > 0 && pathSplit[0].length > 0 && "" + parseInt(pathSplit[0][0]) == pathSplit[0][0]) {
        const regions = pathSplit[0];
        const regionsSplit = regions.split(',')
                                .filter(region => region.length > 0);
        const ret = regionsSplit
                        .filter(region => region.indexOf('-') >= 0)
                        .map(region => parseRegion(region)).reduce((prevValue, currentValue) => 
                            prevValue.concat(currentValue), []);
        ret.push(...regionsSplit.filter(region => region.indexOf('-') < 0).map(item => parseInt(item)));
        return ret;
    
    }
    return [];
}