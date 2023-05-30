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

  it('should resolve hash conflicts for rules', () => {
    const rule = { ruleIdx: 1, nodeTitle: 'test rule 1' };
    const rule2 = { ruleIdx: 2, nodeTitle: 'test rule 1' };
    // @ts-ignore
    hasher.addRule(rule);
    // @ts-ignore
    hasher.addRule(rule2);
    expect(hasher.ruleIdxToHash(rule.ruleIdx)).toBeDefined();
    expect(hasher.ruleIdxToHash(rule.ruleIdx).length).toEqual(6);
    expect(hasher.hashToRuleIds(hasher.ruleIdxToHash(rule.ruleIdx))).toEqual(rule.ruleIdx);

    expect(hasher.ruleIdxToHash(rule2.ruleIdx)).toBeDefined();
    expect(hasher.ruleIdxToHash(rule2.ruleIdx).length).toEqual(7);
    expect(hasher.hashToRuleIds(hasher.ruleIdxToHash(rule2.ruleIdx))).toEqual(rule2.ruleIdx);
  });


  it('should correctly hash and retrieve task index by hash', () => {
    const task = { taskIdx: 1, bodyChunk: { question: { text: 'test question 1' } } };
    // @ts-ignore
    hasher.addTask(task);
    expect(hasher.taskIdxToHash(task.taskIdx)).toBeDefined();
    expect(hasher.hashToTaskIdx(hasher.taskIdxToHash(task.taskIdx))).toEqual(task.taskIdx);
  });

  it('should resolve conflicts for tasks', () => {
    const task = { taskIdx: 1, bodyChunk: { question: { text: 'test question 1' } } };
    // @ts-ignore
    hasher.addTask(task);
    // @ts-ignore
    hasher.addTask({
      ...task,
      taskIdx: 2
    });

    expect(hasher.taskIdxToHash(task.taskIdx)).toBeDefined();
    expect(hasher.taskIdxToHash(task.taskIdx + 1)).toBeDefined();
    expect(hasher.hashToTaskIdx(hasher.taskIdxToHash(task.taskIdx))).toEqual(task.taskIdx);
    expect(hasher.hashToTaskIdx(hasher.taskIdxToHash(task.taskIdx + 1))).toEqual(task.taskIdx + 1);
  });
});