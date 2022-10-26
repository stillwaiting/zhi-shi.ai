import { timeStamp } from 'node:console';
import { threadId } from 'node:worker_threads';
import mdParse from '../md/MarkdownParser';
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
    correctlyAnsweredTasks: number;
    incorrectlyAnsweredTasks: number;
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

    lastAnsweredTaskIdxs: {[taskNodeTitle: string]: Array<number>}; // purged when full for each nodeTitle
    lastAnsweredNodeTitles: Array<string>; // purged when full
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
    private lastAnsweredRuleIdxs: Array<number> = []; // purged when full

    private reversedHistoryTaskIdxLog: Array<Number> = []; // new items come first
    private debugLog = false;

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
        this.selectedRuleIdxs = new Set<number>(JSON.parse(JSON.stringify(Array.from(ruleIdxs))));
        if (ruleIdxs.size > 0) {
            this.lastAnsweredRuleIdxs = this.lastAnsweredRuleIdxs.filter(ruleIdx => ruleIdxs.has(ruleIdx));
        }
        if (ruleIdxs.size > 0 && this.stickyRuleIdx >= 0 && !ruleIdxs.has(this.stickyRuleIdx)) {
            this.stickyRuleIdx = -1;
            this.stickyTaskNodeTitle = '';
        }
    }

    getTopics(): Array<TopicType> {
        return JSON.parse(JSON.stringify(this.topics));
    }

    getRuleTask(ruleIdx: number, ruleTaskIdx: number): TaskType {
        return this.tasks[this.rules[ruleIdx].taskIdxs[ruleTaskIdx]];
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
        
        this.recordAnswerStatsRule(rule, task);

        this.reversedHistoryTaskIdxLog.unshift(taskIdx);
        
        if (this.selectedRuleIdxs.size == 0 && this.lastAnsweredRuleIdxs.length >= this.rules.length) {
            this.lastAnsweredRuleIdxs = [];
        } else if (this.selectedRuleIdxs.size > 0 && this.lastAnsweredRuleIdxs.length >= this.selectedRuleIdxs.size) {
            this.lastAnsweredRuleIdxs = [];
        }

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

    private answeredTaskIdxs: Set<number> = new Set();

    private recordAnswerStatsRule(rule: RuleType, task: TaskType) {
        if (!rule.lastAnsweredTaskIdxs[task.nodeTitle]) {
            rule.lastAnsweredTaskIdxs[task.nodeTitle] = [];
        }
        rule.lastAnsweredTaskIdxs[task.nodeTitle].push(task.taskIdx);
        this.answeredTaskIdxs.add(task.taskIdx);
        this._debugLog("Answered tasks of rule " + rule.ruleIdx +": " + 
            rule.taskIdxs.filter(taskIdx => this.answeredTaskIdxs.has(taskIdx)).length + " of " + rule.taskIdxs.length
            );
        if (rule.lastAnsweredTaskIdxs[task.nodeTitle].length >= rule.taskIdxs.filter(taskIdx => this.tasks[taskIdx].nodeTitle == task.nodeTitle).length) {
            rule.lastAnsweredTaskIdxs[task.nodeTitle] = [];
        }
        rule.lastAnsweredNodeTitles.push(task.nodeTitle);
        if (rule.lastAnsweredNodeTitles.length >= new Set(rule.taskIdxs.map(taskIdx => this.tasks[taskIdx].nodeTitle)).size) {
            rule.lastAnsweredNodeTitles = [];
        }
        if (this.getLastAnsweredRule()?.ruleIdx != rule.ruleIdx) {
            this.lastAnsweredRuleIdxs.push(rule.ruleIdx);
        }
    }

    private recordAnswerStats(task: TaskType, rule: RuleType, topic: TopicType, isCorrect: boolean) {
        if (isCorrect) {
            rule.stats.correctlyAnsweredTasks ++;
            topic.stats.correctlyAnsweredTasks ++;
        } else {
            rule.stats.incorrectlyAnsweredTasks ++;
            topic.stats.incorrectlyAnsweredTasks ++; 
        }
    }

    clearStats() {
        this.topics.forEach((topic) => {
            topic.stats.correctlyAnsweredTasks = 0;
            topic.stats.incorrectlyAnsweredTasks = 0;
        });
        this.rules.forEach((rule) => {
            rule.stats.correctlyAnsweredTasks = 0;
            rule.stats.incorrectlyAnsweredTasks = 0;
            rule.lastAnsweredTaskIdxs = {};
            rule.lastAnsweredNodeTitles = [];
        });
        this.lastAnsweredRuleIdxs = [];
        this.stickyRuleIdx = -1;
        this.stickyTaskNodeTitle = '';
    }
    
    suggestNextTask(): TaskType {
        const task1 = this.doSuggestNextTask();
        const task2 = this.doSuggestNextTask();

        this._debugLog("SNT: 1st task from " + task1.nodeTitle + " " + JSON.stringify(task1.bodyChunk.question));
        this._debugLog("SNT: 2nd task from " + task2.nodeTitle + " " + JSON.stringify(task2.bodyChunk.question));

        const task1HistoryPos = this.reversedHistoryTaskIdxLog.indexOf(task1.taskIdx);
        const task2HistoryPos = this.reversedHistoryTaskIdxLog.indexOf(task2.taskIdx);

        if (task1HistoryPos < 0) {
            this._debugLog("SNT: 1st task wasn't asked yet, returning");
            return task1;
        }

        if (task2HistoryPos < 0) {
            this._debugLog("SNT: 2nd task wasn't asked yet, returning");
            return task2;
        }

        if (task1HistoryPos < task2HistoryPos) {
            this._debugLog("SNT: 1st task was asked later, returning 2nd");
            return task2;
        }

        this._debugLog("SNT: 2nd task was asked later, returning 1st one");

        return task1;
    }

    private doSuggestNextTask(): TaskType {
        this._debugLog("------------");
        
        const suggestedRule = this.suggestNextRule();
        this._debugLog("suggester: picked rule " + suggestedRule.ruleIdx + " " + suggestedRule.nodeTitle + " tasks " + suggestedRule.taskIdxs.length);

        const suggestedTitle = this.suggestRuleTaskNodeTitle(suggestedRule);
        this._debugLog("suggester: suggested task node title " + suggestedTitle);

        const titleTaskIdxs = suggestedRule.taskIdxs.filter(taskIdx => this.tasks[taskIdx].nodeTitle === suggestedTitle);
        this._debugLog("suggester: found " + titleTaskIdxs.length + " from the suggested title ");

        let notAnsweredTitleTaskIdxs = titleTaskIdxs.filter(taskIdx => 
            (suggestedRule.lastAnsweredTaskIdxs[suggestedTitle] || []).indexOf(taskIdx) < 0
        );
        this._debugLog("suggester: found " + notAnsweredTitleTaskIdxs.length + "  non answered tasks");
        if (notAnsweredTitleTaskIdxs.length == 0) {
            notAnsweredTitleTaskIdxs = titleTaskIdxs;
        }

        const taskIdx = notAnsweredTitleTaskIdxs[Math.floor(Math.random() * notAnsweredTitleTaskIdxs.length)]; 

        this._debugLog("------------");
        return JSON.parse(JSON.stringify(
            this.tasks[taskIdx]
        ));
    }

    private suggestNextRule(): RuleType {
        const ruleIdxs: Array<number> = [];

        if (this.stickyRuleIdx >= 0 && this.stickyRuleIdxCount > 0) {
            this._debugLog("DSNT: stick to " + this.rules[this.stickyRuleIdx].nodeTitle);
            ruleIdxs.push(this.stickyRuleIdx);
        } else if (this.selectedRuleIdxs.size > 0) {
            this._debugLog("DSNT: filter by selected rules, excluding answered");
            ruleIdxs.push(...Array.from(this.selectedRuleIdxs).filter(
                ruleIdx => this.lastAnsweredRuleIdxs.indexOf(ruleIdx) == -1
            ));
            if (ruleIdxs.length == 0) {
                ruleIdxs.push(...Array.from(this.selectedRuleIdxs));
            }
        } else {
            this._debugLog("DSNT: get all rules that were not answered recently");
            ruleIdxs.push(...this.rules
                .filter(rule => this.lastAnsweredRuleIdxs.indexOf(rule.ruleIdx) == -1)
                .map(rule => rule.ruleIdx));
            if (ruleIdxs.length == 0) {
                ruleIdxs.push(...this.rules.map(rule => rule.ruleIdx));
            }
        }
        if (ruleIdxs.length < 10) {
            this._debugLog("DSNT: selected " + JSON.stringify(ruleIdxs));
        } else {
            this._debugLog("DSNT: selected " + ruleIdxs.length + " rules");
        }

        const suggestedRuleIdx = ruleIdxs[Math.floor(Math.random() * ruleIdxs.length)];
        return this.rules[suggestedRuleIdx];
    }

    private suggestRuleTaskNodeTitle(suggestedRule: RuleType): string {
        if (this.stickyTaskNodeTitle && this.stickyTaskNodeTitleCount > 0) {
            this._debugLog("SRT: sticky " + this.stickyTaskNodeTitle);
            return this.stickyTaskNodeTitle;
        }
        const ruleTaskNodeTitles = new Set<string>(suggestedRule.taskIdxs.map(taskIdx => this.tasks[taskIdx].nodeTitle));
        const ruleTitles = Array.from(ruleTaskNodeTitles);

        const notAnsweredRuleTitles = ruleTitles.filter(ruleTitle => suggestedRule.lastAnsweredNodeTitles.indexOf(ruleTitle) < 0);

        this._debugLog("SRT: not answered rule titles " + JSON.stringify(notAnsweredRuleTitles));

        const suggestedTitle = notAnsweredRuleTitles[Math.floor(Math.random() * notAnsweredRuleTitles.length)];
        return suggestedTitle;
    }

    enableDebugLog() {
        this.debugLog = true;
    }

    private _debugLog(str: String) {
        if (this.debugLog) {
            console.log(str);
        }
    }

    private getLastAnsweredRule(): RuleType | undefined {
        if (this.lastAnsweredRuleIdxs.length > 0) {
            return this.rules[this.lastAnsweredRuleIdxs[this.lastAnsweredRuleIdxs.length - 1]];
        } else {
            return undefined;
        }
    }

    private parseMarkdown(node: MarkdownNode) {
        if (node.title.indexOf("NR") == 0 || node.title.indexOf("TODO") == 0) {
            return;
        }
        
        if (node.children[0].title.indexOf("Rule") == 0 || node.children[0].title.indexOf("NR") == 0) {
            let topic: TopicType = {
                topicIdx: this.topics.length,
                title: node.title,
                stats: {
                    totalTasks: 0,
                    correctlyAnsweredTasks: 0,
                    incorrectlyAnsweredTasks: 0
                },
                rules: []
            };
            this.topics.push(topic);
            node.children.forEach(ruleNode => {
                this.parseRuleNode(topic, ruleNode);
            });
        } else {
            node.children.map(childNode => this.parseMarkdown(childNode));
        }
    }

    private parseRuleNode(topic: TopicType, ruleNode: MarkdownNode) {
        if (ruleNode.title.indexOf("NR") == 0 || ruleNode.title.indexOf("TODO") == 0) {
            return;
        }
        let rule: RuleType = {
            ruleIdx: this.rules.length,
            topicIdx: topic.topicIdx,
            nodeTitle: ruleNode.title,
            stats: {
                totalTasks: 0,
                correctlyAnsweredTasks: 0,
                incorrectlyAnsweredTasks: 0
            },
            taskIdxs: [],
            lastAnsweredNodeTitles: [],
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
}