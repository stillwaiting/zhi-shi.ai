import { SHA256 } from "crypto-js";
import { RuleType, TaskType } from "./TaskSuggester";

export default class Hasher {
    private _ruleIdxToHash: {[key: number]: string} = {};
    private _hashToRuleIdx: {[key: string]: number} = {};    

    private _taskIdxToHash: {[key: number]: string} = {};
    private _hashToTaskIdx: {[key: string]: number} = {};    

    public addRule(rule: RuleType) {
        this._ruleIdxToHash[rule.ruleIdx] = this.calculateHash(rule.nodeTitle);
        this._hashToRuleIdx[this._ruleIdxToHash[rule.ruleIdx]] = rule.ruleIdx;
    }

    public ruleIdxToHash(ruleIdx: number) {
        return this._ruleIdxToHash[ruleIdx];
    }

    public hashToRuleIds(hash: string) {
        return this._hashToRuleIdx[hash];
    }

    public addTask(task: TaskType) {
        this._taskIdxToHash[task.taskIdx] = this.calculateHash(task.bodyChunk.question.text);
        this._hashToTaskIdx[this._taskIdxToHash[task.taskIdx]] = task.taskIdx;
    }

    public taskIdxToHash(taskIdx: number) {
        return this._taskIdxToHash[taskIdx];
    }

    public hashToTaskIdx(hash: string) {
        return this._hashToTaskIdx[hash];
    }

    private calculateHash(str: string) {
        return SHA256(str).toString().substring(0, 6);
    }
}
