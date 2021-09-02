import { timeStamp } from 'node:console';
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
    private lastAnseredRuleIdx: number = -1;

        constructor(rawMdData: string) {
        const tree = mdParse(rawMdData, []);

        tree.forEach(node => {
            const leaf = this.parseMarkdown(node);
            this.rulesTree.push(leaf);
        });
    }

    setSelectedRuleIdxs(ruleIdxs: Array<number>) {
        this.selectedRuleIdxs = JSON.parse(JSON.stringify(ruleIdxs));
        if (ruleIdxs.indexOf(this.lastAnseredRuleIdx) < 0) {
            this.lastAnseredRuleIdx = -1;
            ruleIdxs.forEach(ruleIdx => {
                const rule = this.rules[ruleIdx];
                if (this.lastAnseredRuleIdx == -1 && this.hasIncorrectAnswer(rule)) {
                    this.lastAnseredRuleIdx = ruleIdx;
                }
            })
        }
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
        if (Object.keys(rule.answeredTaskIdxs).length == rule.taskIdxs.length) {
            rule.answeredTaskIdxs = { [taskIdx] : isCorrect };
        } else {
            rule.answeredTaskIdxs[taskIdx] = isCorrect;
        }
        rule.lastAnswers.push(isCorrect);
        if (rule.lastAnswers.length > 10) {
            rule.lastAnswers.shift();
        }
        this.lastAnseredRuleIdx = rule.ruleIdx;
    }
    
    suggestNextTask(): TaskType {
        const taskIdxsToLookIn: Array<number> = [];
        if (this.lastAnseredRuleIdx >= 0 && this.hasIncorrectAnswer(this.rules[this.lastAnseredRuleIdx])) {
            taskIdxsToLookIn.push(...this.getNotAnsweredTaskIdx(this.rules[this.lastAnseredRuleIdx]));
        } else if (this.selectedRuleIdxs.length > 0) {
            this.selectedRuleIdxs.forEach(ruleIdx => 
                taskIdxsToLookIn.push(...this.getNotAnsweredTaskIdx(this.rules[ruleIdx])));

        } else {
            this.rules.forEach(rule => 
                taskIdxsToLookIn.push(...this.getNotAnsweredTaskIdx(rule)));
        }
        return JSON.parse(JSON.stringify(
            this.tasks[taskIdxsToLookIn[Math.floor(Math.random() * taskIdxsToLookIn.length)]]
        ));
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