import Hasher from './Hasher';

describe('Hasher', () => {
  let hasher: Hasher;

  beforeEach(() => {
    hasher = new Hasher();
  });

  it('should correctly hash and retrieve rule index by hash', () => {
    const rule = { ruleIdx: 1, nodeTitle: 'test rule 1' };
    // @ts-ignore
    hasher.addRule(rule);
    expect(hasher.ruleIdxToHash(rule.ruleIdx)).toBeDefined();
    expect(hasher.ruleIdxToHash(rule.ruleIdx).length).toEqual(6);
    expect(hasher.hashToRuleIds(hasher.ruleIdxToHash(rule.ruleIdx))).toEqual(rule.ruleIdx);
  });

  it('should correctly hash and retrieve task index by hash', () => {
    const task = { taskIdx: 1, bodyChunk: { question: { text: 'test question 1' } } };
    // @ts-ignore
    hasher.addTask(task);
    expect(hasher.taskIdxToHash(task.taskIdx)).toBeDefined();
    expect(hasher.hashToTaskIdx(hasher.taskIdxToHash(task.taskIdx))).toEqual(task.taskIdx);
  });
});