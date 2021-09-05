
// TODO: add test
export function buildPath(ruleIdxs: Array<number>, screen: string) {
    if (ruleIdxs.length == 0) {
        return '/' + screen;
    }
    ruleIdxs.sort();
    const regions: Array<Array<number>> = [];
    let currentRegion = [-1, -1];
    ruleIdxs.forEach(ruleIdx => {
        if (currentRegion[0] == -1) {
            currentRegion = [ruleIdx, ruleIdx];
        } else if (currentRegion[1] + 1 == ruleIdx) {
            currentRegion[1] = ruleIdx;
        } else {
            regions.push(currentRegion);
            currentRegion = [ruleIdx, ruleIdx];
        }
    });
    regions.push(currentRegion);
    return '/' + regions.map(region => {
        if (region[0] == region[1]) {
            return '' + region[0];
        } else {
            return region[0] + '-' + region[1];
        }
    }).join(',') + '/' + screen;
}

function parseRegion(region: string): Array<number> {
    const [from, to] = region.split('-');
    const ret = [];
    for (let currentIdx = parseInt(from); currentIdx <= parseInt(to); currentIdx ++) {
        ret.push(currentIdx);
    }
    return ret;
}

export function extractSelectedRuleIdxsFromPath(path: string): Array<number> {
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