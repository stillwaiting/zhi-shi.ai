import { SHA256 } from "crypto-js";
import { RuleType, TaskType } from "./TaskSuggester";

export default class Hasher {
    private _ruleIdxToHash: {[key: number]: string} = {};
    private _hashToRuleIdx: {[key: string]: number} = {};    

    private _taskIdxToHash: {[key: number]: string} = {};
    private _hashToTaskIdx: {[key: string]: number} = {};    

    public addRule(rule: RuleType) {
        let hash = this.calculateHash(rule.nodeTitle);
        while (this._hashToRuleIdx[hash]) {
            console.error("Hash collision!", rule, hash, this._hashToRuleIdx[hash]);
            hash += "0";
        }
        this._ruleIdxToHash[rule.ruleIdx] = hash;
        this._hashToRuleIdx[hash] = rule.ruleIdx;
    }

    public ruleIdxToHash(ruleIdx: number) {
        return this._ruleIdxToHash[ruleIdx];
    }

    public hashToRuleIds(hash: string) {
        return this._hashToRuleIdx[hash];
    }

    public addTask(task: TaskType) {
        let hash = this.calculateHash(task.bodyChunk.question.text + task.nodeTitle);
        while (this._hashToTaskIdx[hash]) {
            console.log("Hash collision task!", task, hash, this._hashToTaskIdx[hash]);
            hash = hash + "0";
        }
        this._taskIdxToHash[task.taskIdx] = hash;
        this._hashToTaskIdx[hash] = task.taskIdx;
        
        let hash2 = this.calculateHash(task.bodyChunk.question.text);
        while (this._hashToTaskIdx[hash2]) {
            hash2 = hash2 + "0";
        }
        this._hashToTaskIdx[hash2] = task.taskIdx;
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
