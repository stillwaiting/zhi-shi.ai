import mdParse from '../md/MarkdownParser';
import * as _ from "lodash";
import { isMarkdownBodyChunkQuestionAnswers, MarkdownBodyChunkQuestionAnswers, MarkdownNode } from '../md/types';

// Keep TaskType flat to avoid circular dependencies
export type TaskType = {
    taskIdx: number;
    ruleIdx: number;
    topicIdx: number;
    bodyChunk: MarkdownBodyChunkQuestionAnswers;
    nodeTitle: string;
}

export type StatsType = {
    totalTasks: number;
    correctlyAnsweredTaskIdxs: Set<number>;
    incorrectlyAnsweredTaskIdxs: Set<number>;
}

const ERROR_BUFFER_SIZE = 10; // the number of correct answers that must be given to "unstick" from a particual rule 
                             // (when a error was made)

// Keep RuleType flat to avoid circular dependencies
export type RuleType = {
    ruleIdx: number;
    topicIdx: number;

    nodeTitle: string;
    taskIdxs: Array<number>;

    stats: StatsType;

    lastAnsweredTaskIdxs: {[taskNodeTitle: string]: Set<number>}; // purged when full for each nodeTitle
    lastAnsweredNodeTitles: Set<string>; // purged when full
}

export type TopicType = {
    topicIdx: number;
    title: string;

    stats: StatsType;

    rules: Array<RuleType> // always empty for "rule" nodes
}

export default class TaskSuggester {

    

    // Each RuleType object has 2 references: one from the topic, another one from the
    // array (with index = RuleType.ruleIdx)
    // Tasks are not included in the tree, thus keeping it small and making it easy to operate (e.g. to clone)
    private topics: Array<TopicType> = [];
    private rules: Array<RuleType> = [];

    // Each TaskType has only a single reference
    private tasks: Array<TaskType> = []; // taskIdx is the index in this array

    private selectedRuleIdxs: Set<number> = new Set<number>(); // empty means all
    private lastAnsweredRuleIdxs: Set<number> = new Set<number>([]); // purged when full

    private reversedHistoryTaskIdxLog: {[taskIdx: number]: number} /* timestamp */ = {};

    // When answered incorrectly, it will stick to the rule and set count and stick to it until count is 0
    private stickyRuleIdx: number = -1;
    private stickyRuleIdxCount: number = 0;

    // When answered incorrecty, it will stick to the tasks from a particular node
    private stickyTaskNodeTitle: string = '';
    private stickyTaskNodeTitleCount: number = 0;

    constructor(rawMdData: string) {
        const tree = mdParse(rawMdData, []);

        tree.forEach(node => {
            this.parseMarkdown(node);
        });
    }

    setSelectedRuleIdxs(ruleIdxs: Set<number>) {
        this.selectedRuleIdxs = new Set<number>(ruleIdxs);
        if (ruleIdxs.size > 0) {
            this.selectedRuleIdxs.forEach(ruleIdx => this.lastAnsweredRuleIdxs.delete(ruleIdx));
            if (this.lastAnsweredRuleIdxs.size == this.selectedRuleIdxs.size) {
                this.lastAnsweredRuleIdxs.clear();
            }
        }
        if (ruleIdxs.size > 0 && this.stickyRuleIdx >= 0 && !ruleIdxs.has(this.stickyRuleIdx)) {
            this.stickyRuleIdx = -1;
            this.stickyRuleIdxCount = 0;
            
            this.stickyTaskNodeTitle = '';
            this.stickyTaskNodeTitleCount = 0;
        }
    }

    getTopics(): Array<TopicType> {
        return _.cloneDeep(this.topics);
    }

    getTask(taskIdx: number): TaskType {
        return _.cloneDeep(this.tasks[taskIdx]);
    }

    calculateRuleTaskIdx(nextSuggestedTask: TaskType): number {
        return this.rules[nextSuggestedTask.ruleIdx].taskIdxs.indexOf(nextSuggestedTask.taskIdx);
    }

    isTaskInSelectedRules(taskIdx: number): boolean {
        if (this.selectedRuleIdxs.size == 0) {
            return true;
        }
        return this.selectedRuleIdxs.has(this.tasks[taskIdx].ruleIdx);
    }

    recordAnswer(taskIdx: number, isCorrect: boolean) {
        const task = this.tasks[taskIdx];
        const rule = this.rules[task.ruleIdx];
        const topic = this.topics[task.topicIdx];

        this.recordAnswerStats(task, rule, topic, isCorrect);
        
        this.recordLastAnsweredRoundRobin(rule, task);

        this.reversedHistoryTaskIdxLog[taskIdx] = new Date().getTime();

        this.recordAnswerStickyRules(rule, task, isCorrect);
    }

    private recordAnswerStickyRules(rule: RuleType, task: TaskType, isCorrect: boolean) {
        this._debugLog("Sticky rule IDx: " + this.stickyRuleIdx + " " + this.stickyRuleIdxCount);
        this._debugLog("Sticky title: " + this.stickyTaskNodeTitle + " " + this.stickyTaskNodeTitleCount);
        if (isCorrect) {
            if (this.stickyRuleIdx >= 0 && this.stickyRuleIdxCount > 0)  {
                this.stickyRuleIdxCount--;
                if (this.stickyRuleIdxCount == 0) {
                    this.stickyRuleIdx = -1;
                }
            }

            if (this.stickyTaskNodeTitle && this.stickyTaskNodeTitleCount > 0)  {
                this.stickyTaskNodeTitleCount --;
                if (this.stickyTaskNodeTitleCount == 0) {
                    this.stickyTaskNodeTitle = '';
                }
            }
        } else {
            this.stickyRuleIdx = rule.ruleIdx;
            this.stickyRuleIdxCount = ERROR_BUFFER_SIZE;
            this.stickyTaskNodeTitle = task.nodeTitle;
            this.stickyTaskNodeTitleCount = Math.floor(ERROR_BUFFER_SIZE / 3);
        }

        this._debugLog("Sticky rule IDx: " + this.stickyRuleIdx + " " + this.stickyRuleIdxCount);
        this._debugLog("Sticky title: " + this.stickyTaskNodeTitle + " " + this.stickyTaskNodeTitleCount);
    }

    /**
     * 
     * Purging of the last* counters are happening here, on record,
     * therefore no need to worry about it that "suggest" would have some
     * overflown counter
     */
    private recordLastAnsweredRoundRobin(rule: RuleType, task: TaskType) {
        if (!rule.lastAnsweredTaskIdxs[task.nodeTitle]) {
            rule.lastAnsweredTaskIdxs[task.nodeTitle] = new Set<number>();
        }
        rule.lastAnsweredTaskIdxs[task.nodeTitle].add(task.taskIdx);
        if (rule.lastAnsweredTaskIdxs[task.nodeTitle].size >= this.getNodeTitleTaskIdxs(rule, task.nodeTitle).size) {
            rule.lastAnsweredTaskIdxs[task.nodeTitle].clear();
        }

        rule.lastAnsweredNodeTitles.add(task.nodeTitle);
        if (rule.lastAnsweredNodeTitles.size >= this.getRuleNodeTitles(rule).size) {
            rule.lastAnsweredNodeTitles.clear();
        }

        this.lastAnsweredRuleIdxs.add(rule.ruleIdx);
        if (this.selectedRuleIdxs.size == 0 && this.lastAnsweredRuleIdxs.size >= this.rules.length) {
            this.lastAnsweredRuleIdxs.clear();
        } else if (this.selectedRuleIdxs.size > 0 && this.lastAnsweredRuleIdxs.size >= this.selectedRuleIdxs.size) {
            this.lastAnsweredRuleIdxs.clear();
        }
    }

    private getRuleNodeTitles(rule: RuleType): Set<string> {
        return new Set(rule.taskIdxs.map(taskIdx => this.tasks[taskIdx].nodeTitle));
    }

    private getNodeTitleTaskIdxs(rule: RuleType, nodeTitle: string): Set<number> {
        return new Set(rule.taskIdxs.filter(taskIdx => this.tasks[taskIdx].nodeTitle == nodeTitle));
    }

    private recordAnswerStats(task: TaskType, rule: RuleType, topic: TopicType, isCorrect: boolean) {
        if (isCorrect) {
            rule.stats.correctlyAnsweredTaskIdxs.add(task.taskIdx);
            topic.stats.correctlyAnsweredTaskIdxs.add(task.taskIdx);

            rule.stats.incorrectlyAnsweredTaskIdxs.delete(task.taskIdx);
            topic.stats.incorrectlyAnsweredTaskIdxs.delete(task.taskIdx);
        } else {
            rule.stats.correctlyAnsweredTaskIdxs.delete(task.taskIdx);
            topic.stats.correctlyAnsweredTaskIdxs.delete(task.taskIdx);

            rule.stats.incorrectlyAnsweredTaskIdxs.add(task.taskIdx);
            topic.stats.incorrectlyAnsweredTaskIdxs.add(task.taskIdx);; 
        }
    }

    clearStats() {
        this.topics.forEach((topic) => {
            topic.stats.correctlyAnsweredTaskIdxs.clear();
            topic.stats.incorrectlyAnsweredTaskIdxs.clear();
        });
        this.rules.forEach((rule) => {
            rule.stats.correctlyAnsweredTaskIdxs.clear();
            rule.stats.incorrectlyAnsweredTaskIdxs.clear();
            rule.lastAnsweredTaskIdxs = {};
            rule.lastAnsweredNodeTitles.clear();
        });
        this.lastAnsweredRuleIdxs.clear();
        this.stickyRuleIdx = -1;
        this.stickyTaskNodeTitle = '';
    }

    clearStatsForRules(ruleIdxs: Set<number>) {
        ruleIdxs.forEach((ruleIdx) => {
            const rule = this.rules[ruleIdx];
            rule.stats.correctlyAnsweredTaskIdxs.forEach(taskIdx => {
                this.topics[rule.topicIdx].stats.correctlyAnsweredTaskIdxs.delete(taskIdx);
            });
            rule.stats.incorrectlyAnsweredTaskIdxs.forEach(taskIdx => {
                this.topics[rule.topicIdx].stats.incorrectlyAnsweredTaskIdxs.delete(taskIdx);
            })
            rule.stats.correctlyAnsweredTaskIdxs.clear();
            rule.stats.incorrectlyAnsweredTaskIdxs.clear();
        });
    }
    
    suggestNextTask(): TaskType {
        if (Math.random() < 0.33) {
            let suggestedRuleIdxs: Set<number> | undefined;
            if (this.stickyRuleIdx == -1) {
                suggestedRuleIdxs = this.getSuitableRuleIdxs(false);
            } else if (this.stickyRuleIdx && !this.stickyTaskNodeTitle) {
                suggestedRuleIdxs = new Set<number>([this.stickyRuleIdx]);
            }

            if (suggestedRuleIdxs) {
                const unansweredTask = this.doSuggestNextTaskUnanswered(suggestedRuleIdxs);
                if (unansweredTask) {
                    return unansweredTask;
                }
            }
        }

        const task1 = this.doSuggestNextTaskRoundRobin();
        const task2 = this.doSuggestNextTaskRoundRobin();

        this._debugLog("SNT: 1st task from " + task1.nodeTitle + " " + JSON.stringify(task1.bodyChunk.question));
        this._debugLog("SNT: 2nd task from " + task2.nodeTitle + " " + JSON.stringify(task2.bodyChunk.question));

        const task1HistoryPos = this.reversedHistoryTaskIdxLog[task1.taskIdx];
        const task2HistoryPos = this.reversedHistoryTaskIdxLog[task2.taskIdx];

        if (!task1HistoryPos) {
            this._debugLog("SNT: 1st task wasn't asked yet, returning");
            return task1;
        }

        if (!task2HistoryPos) {
            this._debugLog("SNT: 2nd task wasn't asked yet, returning");
            return task2;
        }

        if (task1HistoryPos < task2HistoryPos) {
            this._debugLog("SNT: 2nd task was asked later, returning 1st");
            return task1;
        }

        this._debugLog("SNT: 1st task was asked later, returning 2nd one");

        return task2;
    }

    doSuggestNextTaskUnanswered(suggestedRuleIdxs: Set<number>): TaskType | undefined {
        const suggestedTaskIdxs: Array<number> = [];
        suggestedRuleIdxs.forEach(ruleIdx => suggestedTaskIdxs.push(...this.rules[ruleIdx].taskIdxs.filter(taskIdx => 
            !(this.rules[ruleIdx].stats.correctlyAnsweredTaskIdxs.has(taskIdx) ||
            this.rules[ruleIdx].stats.incorrectlyAnsweredTaskIdxs.has(taskIdx))
        )));
        if (suggestedTaskIdxs.length > 0) {
            return _.cloneDeep(
                this.tasks[suggestedTaskIdxs[Math.floor(Math.random() * suggestedTaskIdxs.length)]]
            );
        }
        return undefined;
    }

    /**
     * 
     * Suggests the next task in a round robin fashion:
     * 
     *  - sticky rules/tasks node titles have priorities
     *  - going in round-robin with rules 
     */
    private doSuggestNextTaskRoundRobin(): TaskType {
        this._debugLog("------------");
        
        const suggestedRule = this.suggestNextRuleRoundRobin();
        this._debugLog("suggester: picked rule " + suggestedRule.ruleIdx + " " + suggestedRule.nodeTitle + " tasks " + suggestedRule.taskIdxs.length);

        const suggestedTitle = this.suggestRuleTaskNodeTitle(suggestedRule);
        this._debugLog("suggester: suggested task node title " + suggestedTitle);

        const titleTaskIdxs = this.getNodeTitleTaskIdxs(suggestedRule, suggestedTitle);
        this._debugLog("suggester: found " + titleTaskIdxs.size + " from the suggested title ");

        let notAnsweredTitleTaskIdxs = _.cloneDeep(titleTaskIdxs);
        (suggestedRule.lastAnsweredTaskIdxs[suggestedTitle] || new Set<number>())
            .forEach(taskIdx => notAnsweredTitleTaskIdxs.delete(taskIdx));
        this._debugLog("suggester: found " + notAnsweredTitleTaskIdxs.size + "  non answered tasks");

        const candidates = Array.from(notAnsweredTitleTaskIdxs);
        const taskIdx = candidates[Math.floor(Math.random() * candidates.length)]; 

        this._debugLog("------------");
        return _.cloneDeep(this.tasks[taskIdx]);
    }

    /**
     * 
     * Sticky rule has a top priority.
     * 
     * Recently answered rules are excluded from consideration.
     * 
     * Returns a random rule if not sticky and not recently answered.
     * 
     */
    private suggestNextRuleRoundRobin(): RuleType {
        const ruleIdxs: Array<number> = [];

        if (this.stickyRuleIdx >= 0 && this.stickyRuleIdxCount > 0) {
            this._debugLog("DSNT: stick to " + this.rules[this.stickyRuleIdx].nodeTitle);
            ruleIdxs.push(this.stickyRuleIdx);
        } else  {
            ruleIdxs.push(...this.getSuitableRuleIdxs());
        }
        
        if (ruleIdxs.length < 10) {
            this._debugLog("DSNT: selected " + JSON.stringify(ruleIdxs));
        } else {
            this._debugLog("DSNT: selected " + ruleIdxs.length + " rules");
        }

        const suggestedRuleIdx = ruleIdxs[Math.floor(Math.random() * ruleIdxs.length)];
        return this.rules[suggestedRuleIdx];
    }

    /**
     * 
     * Sticky node title has priority.
     * 
     * Returns a node title that wasn't recently answered.
     *  
     */
    private suggestRuleTaskNodeTitle(suggestedRule: RuleType): string {
        if (this.stickyTaskNodeTitle && this.stickyTaskNodeTitleCount > 0) {
            this._debugLog("SRT: sticky " + this.stickyTaskNodeTitle);
            return this.stickyTaskNodeTitle;
        }
        const suggestedNdodeTitles = this.getRuleNodeTitles(suggestedRule);

        suggestedRule.lastAnsweredNodeTitles.forEach((answeredNodeTitle) => {
            suggestedNdodeTitles.delete(answeredNodeTitle);
        });

        this._debugLog("SRT: not answered rule titles " + JSON.stringify(suggestedNdodeTitles));

        const candidates = Array.from(suggestedNdodeTitles);
        const suggestedTitle = candidates[Math.floor(Math.random() * candidates.length)];
        return suggestedTitle;
    }

    getTaskRuleIdx(taskIdx: number): number {
        return this.tasks[taskIdx].ruleIdx;
    }

    private debugMode() {
        return window && window.localStorage && window.localStorage.getItem("debug");
    }

    private _debugLog(str: String) {
        if (this.debugMode()) {
            console.log(str);
        }
    }

    private isIgnored(nodeTitle: string) {
        if (nodeTitle.indexOf("[nr]") >= 0 || nodeTitle.indexOf("[todo]") >= 0) {
            return true;
        }
        if (!this.debugMode() && nodeTitle.indexOf("[debug]") >= 0) {
            return true;
        }
        return false;
    }

    private parseMarkdown(node: MarkdownNode) {
        if (this.isIgnored(node.title)) {
            return;
        }
        
        if (node.children[0].title.indexOf("Rule") == 0) {
            let topic: TopicType = {
                topicIdx: this.topics.length,
                title: node.title,
                stats: {
                    totalTasks: 0,
                    correctlyAnsweredTaskIdxs: new Set(),
                    incorrectlyAnsweredTaskIdxs: new Set()
                },
                rules: []
            };
            node.children.forEach(ruleNode => {
                this.parseRuleNode(topic, ruleNode);
            });
            if (topic.rules.length > 0) {
                this.topics.push(topic);
            }
        } else {
            node.children.map(childNode => this.parseMarkdown(childNode));
        }
    }

    private parseRuleNode(topic: TopicType, ruleNode: MarkdownNode) {
        if (this.isIgnored(ruleNode.title)) {
            return;
        }
        
        let rule: RuleType = {
            ruleIdx: this.rules.length,
            topicIdx: topic.topicIdx,
            nodeTitle: ruleNode.title.replace("[OK!]", "").trim(),
            stats: {
                totalTasks: 0,
                correctlyAnsweredTaskIdxs: new Set(),
                incorrectlyAnsweredTaskIdxs: new Set()
            },
            taskIdxs: [],
            lastAnsweredNodeTitles: new Set<string>(),
            lastAnsweredTaskIdxs: {}
        };
        if (ruleNode.children.find(child => child.title.indexOf("Task") == 0)) {
            this.rules.push(rule);
            topic.rules.push(rule);
            ruleNode.children.forEach(taskNode => {
                if (taskNode.title.indexOf("Task") == 0) {
                    this.parseTaskNode(topic, rule, taskNode);
                }
            })
        }
    }

    private parseTaskNode(topic: TopicType, rule: RuleType, taskNode: MarkdownNode) {
        taskNode.body.content.forEach(maybeTask => {
            if (isMarkdownBodyChunkQuestionAnswers(maybeTask)) {
                const task: TaskType = {
                    nodeTitle: taskNode.title,
                    taskIdx: this.tasks.length,
                    bodyChunk: maybeTask,
                    ruleIdx: rule.ruleIdx,
                    topicIdx: topic.topicIdx
                };
                this.tasks.push(task);
                topic.stats.totalTasks ++;
                rule.stats.totalTasks ++;
                rule.taskIdxs.push(task.taskIdx);
            }
        })
    }

    /**
     * Returns an array of recently un-answered selected ruleIdxs that are suitable for being next suggested rule
     */
    private getSuitableRuleIdxs(removeRecentlyAnsered = true): Set<number> {
        if (this.selectedRuleIdxs.size > 0) {
            const suitableRuleIdxs = new Set<number>(this.selectedRuleIdxs);
            if (removeRecentlyAnsered) {
                this.lastAnsweredRuleIdxs.forEach(answeredRuleIdx => suitableRuleIdxs.delete(answeredRuleIdx));
            }
            return suitableRuleIdxs;
        } else {
            if (removeRecentlyAnsered) {
                return new Set(this.rules
                    .filter(rule => !this.lastAnsweredRuleIdxs.has(rule.ruleIdx))
                    .map(rule => rule.ruleIdx));
            } else {
                return new Set(this.rules.map(rule => rule.ruleIdx));
            }
        }
    }
    
}

