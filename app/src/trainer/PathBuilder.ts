
function buildSelectionPathChunk(ruleIdxsSet: Set<number>) {
    const ruleIdxs = Array.from(ruleIdxsSet);
    ruleIdxs.sort((a, b) => a-b);
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
    return regions.map(region => {
        if (region[0] == region[1]) {
            return '' + region[0];
        } else {
            return region[0] + '-' + region[1];
        }
    }).join(',');
}

function parseSelectionRegion(region: string): Array<number> {
    const [from, to] = region.split('-');
    const ret = [];
    for (let currentIdx = parseInt(from); currentIdx <= parseInt(to); currentIdx ++) {
        ret.push(currentIdx);
    }
    return ret;
}

function parseSelectionPathChunk(path: string): Set<number> {
    const pathSplit = path.split("/").filter(pathChunk => pathChunk.length > 0);
    if (pathSplit.length > 0 && pathSplit[0].length > 0 && "" + parseInt(pathSplit[0][0]) == pathSplit[0][0]) {
        const regions = pathSplit[0];
        const regionsSplit = regions.split(',')
                                .filter(region => region.length > 0);
        const ret = regionsSplit
                        .filter(region => region.indexOf('-') >= 0)
                        .map(region => parseSelectionRegion(region)).reduce((prevValue, currentValue) => 
                            prevValue.concat(currentValue), []);
        ret.push(...regionsSplit.filter(region => region.indexOf('-') < 0).map(item => parseInt(item)));
        return new Set<number>(ret);
    
    }
    return new Set<number>([]);
}

export interface SelectedTask{
    ruleIdx: number;
    ruleTaskIdx: number;
}

export class PathBuilder {

    private rules: Set<number> = new Set<number>([]);
    private selectedTask: SelectedTask = { ruleIdx: -1, ruleTaskIdx: -1 };
    private screen?: string;

    constructor(path: string) {
        this.parse(path);
    }

    populate(path: PathBuilder) {
        this.rules = path.getRules();
        this.selectedTask = path.getTask();
        this.screen = path.getScreen();
        return this;
    }

    buildPath() {
        let path = "";
        if (this.rules.size > 0) {
            path += "/rules/" + buildSelectionPathChunk(this.rules);
        }
        if (this.selectedTask.ruleIdx >= 0) {
            path += `/task/${this.selectedTask.ruleIdx}-${this.selectedTask.ruleTaskIdx}`;
        }
        if (this.screen) {
            path += "/" + this.screen;
        }
        if (path.length) {
            return path;
        }
        return '/';
    }

    getRules(): Set<number> {
        return new Set(JSON.parse(JSON.stringify([...this.rules])));
    }

    setSelection(selection: Set<number>) {
        this.rules =new Set(JSON.parse(JSON.stringify([...selection])));
        return this;
    }

    getScreen(): string | undefined {
        return this.screen;
    }

    setScreen(screen?: string) {
        this.screen = screen;
        return this;
    }

    getTask(): SelectedTask {
        return JSON.parse(JSON.stringify(this.selectedTask));
    }

    setTask(task: SelectedTask) {
        this.selectedTask = JSON.parse(JSON.stringify(task));
        return this;
    }

    private parse(pathUnsanitised: string) {
        this.rules.clear();
        this.selectedTask = {
            ruleIdx: -1,
            ruleTaskIdx: -1
        };
        this.screen = undefined;

        let path = pathUnsanitised.toLowerCase().trim();
        if (path.startsWith('/')) {
            path = path.substring(1);
        }

        if (path === '' || path === '/') {
            return;
        }

        const splitPath = path.split("/");
        for (let splitPathIdx = 0; splitPathIdx < splitPath.length - 1; splitPathIdx++) {
            const pathChunk = splitPath[splitPathIdx];
            const nextPathChunk = splitPath[splitPathIdx + 1];
            if (pathChunk == 'rules') {
                this.rules = parseSelectionPathChunk(nextPathChunk);
            }
            if (pathChunk == 'task') {
                const [ruleIdx, ruleTaskIdx] = nextPathChunk.split('-');
                this.selectedTask = {
                    ruleIdx: Number(ruleIdx),
                    ruleTaskIdx: Number(ruleTaskIdx)
                };
            }
        }
        if ((splitPath.length%2) === 1) {
            this.screen = splitPath[splitPath.length - 1];
        }
    }
}