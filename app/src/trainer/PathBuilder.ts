import _ from "lodash";
import Hasher from "./Hasher";

export class PathBuilder {

    private rules: Set<number> = new Set<number>([]);
    private selectedTaskIdx: number = -1;
    private screen?: string;
    private hasher: Hasher;

    constructor(path: string, hasher: Hasher) {
        this.hasher = hasher;
        this.parse(path);
    }

    populate(path: PathBuilder) {
        this.rules = path.getRules();
        this.selectedTaskIdx = path.getTaskIdx();
        this.screen = path.getScreen();
        return this;
    }

    buildPath() {
        let path = "";
        if (this.rules.size > 0) {
            path += "/rules/" + this.buildSelectionPathChunk(this.rules);
        }
        if (this.selectedTaskIdx >= 0) {
            path += `/task/${this.hasher.taskIdxToHash(this.selectedTaskIdx)}`;
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
        return _.cloneDeep(this.rules);
    }

    setSelection(selection: Set<number>) {
        this.rules =_.cloneDeep(selection);
        return this;
    }

    getScreen(): string | undefined {
        return this.screen;
    }

    setScreen(screen?: string) {
        this.screen = screen;
        return this;
    }

    /**
     * 
     * @returns -1 when none selected
     */
    getTaskIdx(): number {
        return this.selectedTaskIdx;
    }

    setTaskIdx(taskIdx: number) {
        this.selectedTaskIdx = taskIdx;
        return this;
    }

    private parse(pathUnsanitised: string) {
        this.rules.clear();
        this.selectedTaskIdx = -1;
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
                this.rules = this.parseSelectionPathChunk(nextPathChunk);
            }
            if (pathChunk == 'task') {
                this.selectedTaskIdx = this.hasher.hashToTaskIdx(nextPathChunk);
                if (this.selectedTaskIdx === undefined) {
                    this.selectedTaskIdx = -1;
                }
            }
        }
        if ((splitPath.length%2) === 1) {
            this.screen = splitPath[splitPath.length - 1];
        }
    }

    private buildSelectionPathChunk(ruleIdxsSet: Set<number>) {
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
                return '' + this.hasher.ruleIdxToHash(region[0]);
            } else {
                return this.hasher.ruleIdxToHash(region[0]) + '-' + this.hasher.ruleIdxToHash(region[1]);
            }
        }).join(',');
    }
    
    private parseSelectionRegion(region: string): Array<number> {
        const [from, to] = region.split('-');
        const ret = [];
        for (let currentIdx = this.hasher.hashToRuleIds(from); currentIdx <= this.hasher.hashToRuleIds(to); currentIdx ++) {
            ret.push(currentIdx);
        }
        return ret;
    }
    
    private parseSelectionPathChunk(path: string): Set<number> {
        const pathSplit = path.split("/").filter(pathChunk => pathChunk.length > 0);
        if (pathSplit.length > 0 && pathSplit[0].length > 0) {
            const regions = pathSplit[0];
            const regionsSplit = regions.split(',')
                                    .filter(region => region.length > 0);
            const ret = regionsSplit
                            .filter(region => region.indexOf('-') >= 0)
                            .map(region => this.parseSelectionRegion(region)).reduce((prevValue, currentValue) => 
                                prevValue.concat(currentValue), []);
            ret.push(...regionsSplit.filter(region => region.indexOf('-') < 0).map(item => this.hasher.hashToRuleIds(item)).filter(item => item !== undefined));
            return new Set<number>(ret);
        
        }
        return new Set<number>([]);
    }
    
}