import { timeStamp } from 'node:console';
import { threadId } from 'node:worker_threads';
import mdParse from '../md/MarkdownParser';
import { isMarkdownBodyChunkQuestionAnswers, MarkdownBodyChunkQuestionAnswers, MarkdownNode } from '../md/types';

// Keep TaskType flat to avoid circular dependencies
export type TaskType = {
    taskIdx: number;
    bodyChunk: MarkdownBodyChunkQuestionAnswers;
    ruleIdx: number;
}

// Keep RuleType flat to avoid circular dependencies
type RuleType = {
    ruleIdx: number;
    nodeTitle: string;
    taskIdxs: Array<number>;
    answeredTaskIdxs: { [taskIdx: number]: boolean }; // purged when full; true - correctly, false - incorrectly
    lastAnswers: Array<boolean>; // true - correctly, false - incorrectly
}

type RuleTreeLeafType = {
    title: string,
    rule: RuleType | undefined,

    children: Array<RuleTreeLeafType> // always empty for "rule" nodes
}

export default class TaskSuggester {

    // Each RuleType object has 2 references: one from the tree, another one from the
    // array (with index = RuleType.ruleIdx)
    // Tasks are not included in the tree, thus keeping it small and making it easy to operate (e.g. to clone)
    private rulesTree: Array<RuleTreeLeafType> = [];
    private rules: Array<RuleType> = [];

    // Each TaskType has only a single reference
    private tasks: Array<TaskType> = []; // taskIdx is the index in this array

    private selectedRuleIdxs: Array<number> = []; // empty means all
    private lastAnsweredRuleIdxs: Array<number> = [];

        constructor(rawMdData: string) {
        const tree = mdParse(rawMdData, []);

        tree.forEach(node => {
            const leaf = this.parseMarkdown(node);
            this.rulesTree.push(leaf);
        });
    }

    setSelectedRuleIdxs(ruleIdxs: Array<number>) {
        this.selectedRuleIdxs = JSON.parse(JSON.stringify(ruleIdxs));
        this.lastAnsweredRuleIdxs = [];
    }

    getRulesTree(): Array<RuleTreeLeafType> {
        return JSON.parse(JSON.stringify(this.rulesTree));
    }

    isTaskInSelectedRules(taskIdx: number): boolean {
        if (this.selectedRuleIdxs.length == 0) {
            return true;
        }
        return this.selectedRuleIdxs.indexOf(this.tasks[taskIdx].ruleIdx) >= 0;
    }

    recordAnswer(taskIdx: number, isCorrect: boolean) {
        const rule = this.rules[this.tasks[taskIdx].ruleIdx];
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
            if (this.selectedRuleIdxs.length == 0 && this.lastAnsweredRuleIdxs.length >= this.rules.length) {
                this.lastAnsweredRuleIdxs = [];
            } else if (this.selectedRuleIdxs.length > 0 && this.lastAnsweredRuleIdxs.length >= this.selectedRuleIdxs.length) {
                this.lastAnsweredRuleIdxs = [];
            }
        }
    }
    
    suggestNextTask(): TaskType {
        const ruleIdxs: Array<number> = [];
        if (this.getLastAnsweredRule() && this.hasIncorrectAnswer(this.getLastAnsweredRule()!)) {
            ruleIdxs.push(this.getLastAnsweredRule()!.ruleIdx);
        } else if (this.selectedRuleIdxs.length > 0) {
            ruleIdxs.push(...this.selectedRuleIdxs
                .filter(ruleIdx => this.lastAnsweredRuleIdxs.indexOf(ruleIdx) == -1));
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

    private parseMarkdown(node: MarkdownNode): RuleTreeLeafType {
        let leaf: RuleTreeLeafType = {
            title: node.title,
            rule: undefined,
            children: []
        };
        if (node.title.indexOf("Rule") == 0) {
            this.rules.push({
                ruleIdx: this.rules.length,
                nodeTitle: node.title,
                taskIdxs: [],
                answeredTaskIdxs: [],
                lastAnswers: []
            });
            leaf.rule = this.rules[this.rules.length - 1];
        }
        if (node.title.indexOf("Task") == 0) {
            node.body.content.forEach(maybeTask => {
                if (isMarkdownBodyChunkQuestionAnswers(maybeTask)) {
                    const task: TaskType = {
                        taskIdx: this.tasks.length,
                        bodyChunk: maybeTask,
                        ruleIdx: this.rules.length - 1
                    };
                    this.tasks.push(task);
                    this.rules[this.rules.length - 1].taskIdxs.push(this.tasks.length - 1);
                }
            })
        }

        
        node.children.forEach(child => {
            const childLeaf = this.parseMarkdown(child)
            if (node.title.indexOf("Rule") != 0) {
                leaf.children.push(childLeaf);
            }
        });

        return leaf;
    }
}