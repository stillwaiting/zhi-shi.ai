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
}

export type StatsType = {
    totalTasks: number;
    correctlyAnsweredTasks: number;
    incorrectlyAnsweredTasks: number;
}

// Keep RuleType flat to avoid circular dependencies
export type RuleType = {
    ruleIdx: number;
    topicIdx: number;

    nodeTitle: string;
    taskIdxs: Array<number>;

    stats: StatsType;

    answeredTaskIdxs: { [taskIdx: number]: boolean }; // purged when full; true - correctly, false - incorrectly
    lastAnswers: Array<boolean>; // true - correctly, false - incorrectly
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
    private lastAnsweredRuleIdxs: Array<number> = [];

    constructor(rawMdData: string) {
        const tree = mdParse(rawMdData, []);

        tree.forEach(node => {
            this.parseMarkdown(node);
        });
    }

    setSelectedRuleIdxs(ruleIdxs: Set<number>) {
        this.selectedRuleIdxs = new Set<number>(JSON.parse(JSON.stringify(Array.from(ruleIdxs))));
        this.lastAnsweredRuleIdxs = [];
    }

    getTopics(): Array<TopicType> {
        return JSON.parse(JSON.stringify(this.topics));
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
        if (isCorrect) {
            rule.stats.correctlyAnsweredTasks ++;
            topic.stats.correctlyAnsweredTasks ++;
        } else {
            rule.stats.incorrectlyAnsweredTasks ++;
            topic.stats.incorrectlyAnsweredTasks ++; 
        }
        rule.answeredTaskIdxs[taskIdx] = isCorrect;
        if (Object.keys(rule.answeredTaskIdxs).length == rule.taskIdxs.length) {
            rule.answeredTaskIdxs = { };
        }
        rule.lastAnswers.push(isCorrect);
        if (rule.lastAnswers.length > 10) {
            rule.lastAnswers.shift();
        }
        if (this.getLastAnsweredRule()?.ruleIdx != rule.ruleIdx) {
            this.lastAnsweredRuleIdxs.push(rule.ruleIdx);
        } 
        
        if (isCorrect) { // TODO: add test; incorrect must stay to suggest it again
            if (this.selectedRuleIdxs.size == 0 && this.lastAnsweredRuleIdxs.length >= this.rules.length) {
                this.lastAnsweredRuleIdxs = [];
            } else if (this.selectedRuleIdxs.size > 0 && this.lastAnsweredRuleIdxs.length >= this.selectedRuleIdxs.size) {
                this.lastAnsweredRuleIdxs = [];
            }
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
            rule.answeredTaskIdxs = {};
            rule.lastAnswers = [];
        });
        this.lastAnsweredRuleIdxs = [];
    }
    
    suggestNextTask(): TaskType {
        const ruleIdxs: Array<number> = [];
        if (this.getLastAnsweredRule() && this.hasIncorrectAnswer(this.getLastAnsweredRule()!)) {
            ruleIdxs.push(this.getLastAnsweredRule()!.ruleIdx);
        } else if (this.selectedRuleIdxs.size > 0) {
            ruleIdxs.push(...Array.from(this.selectedRuleIdxs).filter(
                ruleIdx => this.lastAnsweredRuleIdxs.indexOf(ruleIdx) == -1
            ));
        } else {
            ruleIdxs.push(...this.rules
                .filter(rule => this.lastAnsweredRuleIdxs.indexOf(rule.ruleIdx) == -1)
                .map(rule => rule.ruleIdx));
        }

        const nonEmptyRuleIdx = ruleIdxs.filter(ruleIdx => this.rules[ruleIdx].taskIdxs.length > 0);
        
        if (nonEmptyRuleIdx.length == 0) {
            this.lastAnsweredRuleIdxs = [];
            return this.suggestNextTask();
        }

        const taskIdxsToLookIn: Array<number> = [];
        nonEmptyRuleIdx.forEach(ruleIdx => taskIdxsToLookIn.push(...this.getNotAnsweredTaskIdx(this.rules[ruleIdx])));
        
        return JSON.parse(JSON.stringify(
            this.tasks[taskIdxsToLookIn[Math.floor(Math.random() * taskIdxsToLookIn.length)]]
        ));
    }

    private getLastAnsweredRule(): RuleType | undefined {
        if (this.lastAnsweredRuleIdxs.length > 0) {
            return this.rules[this.lastAnsweredRuleIdxs[this.lastAnsweredRuleIdxs.length - 1]];
        } else {
            return undefined;
        }
    }

    private getNotAnsweredTaskIdx(rule: RuleType): Array<number> {
        if (Object.keys(rule.answeredTaskIdxs).length == rule.taskIdxs.length) {
            return rule.taskIdxs;
        }
        return rule.taskIdxs.filter(taskIdx => rule.answeredTaskIdxs[taskIdx] === undefined);
    }

    private hasIncorrectAnswer(rule: RuleType): boolean {
        return rule.lastAnswers.indexOf(false) >= 0;
    }

    private parseMarkdown(node: MarkdownNode) {
        if (node.children[0].title.indexOf("Rule") == 0) {
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
            answeredTaskIdxs: [],
            lastAnswers: []
        };
        this.rules.push(rule);
        topic.rules.push(rule);
        ruleNode.children.forEach(taskNode => {
            if (taskNode.title.indexOf("Task") == 0) {
                this.parseTaskNode(topic, rule, taskNode);
            }
        })
    }

    private parseTaskNode(topic: TopicType, rule: RuleType, taskNode: MarkdownNode) {
        taskNode.body.content.forEach(maybeTask => {
            if (isMarkdownBodyChunkQuestionAnswers(maybeTask)) {
                const task: TaskType = {
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