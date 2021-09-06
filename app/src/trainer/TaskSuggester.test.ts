import TaskSuggester from './TaskSuggester';

describe('TaskSuggester', () => {

    let suggester!: TaskSuggester;

    beforeEach(() => {
        suggester = new TaskSuggester(`
   
# Root 1

## SubNode 1

### Rule 0: empty rule, no tasks

### Rule 1: single tasks node

#### Task  node 0

Some text that should be ignored.

? 0 Hello (foo|bar)
! world

? 1 Bar baz (hello|world)
! hello

### Rule 2: several task nodes

#### Task node 1

? 2 blah (a|b)
! a

? 3 blah (c|d)
! c

#### Task node 2

? 4 blah (e|f)
! e

? 5 blah (g|h)
! gs

# Root 2

## Rule: another root

### Task node 3

Some text that should be ignored.

? 6 (Hello|bye)
! hello

? 7 (Cat|Dog)
! cat

        
`)
    });


    test('On create builds tree of rules and tasks', () => {
        const tree = suggester.getTopics();
        expect(tree).toStrictEqual([
          {
            "topicIdx": 0,
            "title": "SubNode 1",
            "stats": {
              "totalTasks": 6,
              "correctlyAnsweredTasks": 0,
              "incorrectlyAnsweredTasks": 0
            },
            "rules": [
              {
                "ruleIdx": 0,
                "topicIdx": 0,
                "nodeTitle": "Rule 0: empty rule, no tasks",
                "stats": {
                  "totalTasks": 0,
                  "correctlyAnsweredTasks": 0,
                  "incorrectlyAnsweredTasks": 0
                },
                "taskIdxs": [],
                "answeredTaskIdxs": [],
                "lastAnswers": []
              },
              {
                "ruleIdx": 1,
                "topicIdx": 0,
                "nodeTitle": "Rule 1: single tasks node",
                "stats": {
                  "totalTasks": 2,
                  "correctlyAnsweredTasks": 0,
                  "incorrectlyAnsweredTasks": 0
                },
                "taskIdxs": [
                  0,
                  1
                ],
                "answeredTaskIdxs": [],
                "lastAnswers": []
              },
              {
                "ruleIdx": 2,
                "topicIdx": 0,
                "nodeTitle": "Rule 2: several task nodes",
                "stats": {
                  "totalTasks": 4,
                  "correctlyAnsweredTasks": 0,
                  "incorrectlyAnsweredTasks": 0
                },
                "taskIdxs": [
                  2,
                  3,
                  4,
                  5
                ],
                "answeredTaskIdxs": [],
                "lastAnswers": []
              }
            ]
          },
          {
            "topicIdx": 1,
            "title": "Root 2",
            "stats": {
              "totalTasks": 2,
              "correctlyAnsweredTasks": 0,
              "incorrectlyAnsweredTasks": 0
            },
            "rules": [
              {
                "ruleIdx": 3,
                "topicIdx": 1,
                "nodeTitle": "Rule: another root",
                "stats": {
                  "totalTasks": 2,
                  "correctlyAnsweredTasks": 0,
                  "incorrectlyAnsweredTasks": 0
                },
                "taskIdxs": [
                  6,
                  7
                ],
                "answeredTaskIdxs": [],
                "lastAnswers": []
              }
            ]
          }
        ]);
    });

    test('Selected rules limit the choice of tasks', () => {
        suggester.setSelectedRuleIdxs(new Set<number>([3]));
        const suggestedTaskIdxs = new Set<number>();
        for (let count = 0; count < 100; count ++ ) {
            suggestedTaskIdxs.add(suggester.suggestNextTask().taskIdx);
        }

        const expected = new Set<number>([6,7]);
        expected.add(6);
        expected.add(7);
        expect(suggestedTaskIdxs).toStrictEqual(expected);
    });

    test('Empty selected rules act as all rules', () => {
        suggester.setSelectedRuleIdxs(new Set<number>([]));

        const suggestedTaskIdxs = new Set<number>();
        for (let count = 0; count < 100; count ++ ) {
            suggestedTaskIdxs.add(suggester.suggestNextTask().taskIdx);
        }

        const expected = new Set<number>([0,1,2,3,4,5,6,7]);
        expect(suggestedTaskIdxs).toStrictEqual(expected);
    });

    test('Answer excludes the task from the pool of tasks to select', () => {
        suggester.setSelectedRuleIdxs(new Set<number>([2]));
        const suggestedTaskIdxs = new Set<number>();
        for (let count = 0; count < 100; count ++ ) {
            if (suggestedTaskIdxs.size == 4) {
                suggestedTaskIdxs.clear();
            }
            const nextTaskIdx = suggester.suggestNextTask().taskIdx;
            suggester.recordAnswer(nextTaskIdx, true);
            expect(suggestedTaskIdxs).not.toContain(nextTaskIdx);
            suggestedTaskIdxs.add(nextTaskIdx);
        }
    });

    test('Answer updates statistis', () => {
        suggester.recordAnswer(0, true);
        expect(suggester.getTopics()[0].stats.correctlyAnsweredTasks).toBe(1);
        expect(suggester.getTopics()[0].rules[1].stats.correctlyAnsweredTasks).toBe(1);
    });

    test('Clean statistics cleans statistis', () => {
      suggester.recordAnswer(0, true);
      suggester.clearStats();
      expect(suggester.getTopics()[0].stats.correctlyAnsweredTasks).toBe(0);
      expect(suggester.getTopics()[0].rules[1].stats.correctlyAnsweredTasks).toBe(0);
    });

    test('Round-robins through rules', () => {
      suggester.recordAnswer(0, true);
      suggester.recordAnswer(2, true);
      const suggestedTaskIdx = new Set<number>();
      for (let attempts = 0; attempts < 100; attempts ++) {
        suggestedTaskIdx.add(suggester.suggestNextTask().taskIdx);
      }
      expect(suggestedTaskIdx).toStrictEqual(new Set<number>([6,7]));
    });

    test('Cleanup drops answered rules memory', () => {
      suggester.recordAnswer(0, true);
      suggester.recordAnswer(2, true);
      suggester.clearStats();
      const suggestedTaskIdx = new Set<number>();
      for (let attempts = 0; attempts < 100; attempts ++) {
        suggestedTaskIdx.add(suggester.suggestNextTask().taskIdx);
      }
      expect(suggestedTaskIdx).toStrictEqual(new Set<number>([0,1,2,3,4,5,6,7]));
    });

    test('The answered task is added back to the pool when all other tasks are answered, too', () => {
        suggester.setSelectedRuleIdxs(new Set<number>([2]));
        const stats: {[taskIdx:number] : number} = {};
        for (let count = 0; count < 80; count ++ ) {
            const nextTaskIdx = suggester.suggestNextTask().taskIdx;
            suggester.recordAnswer(nextTaskIdx, true);
            stats[nextTaskIdx] = stats[nextTaskIdx] ? stats[nextTaskIdx] + 1 : 1;
        }
        expect(stats).toStrictEqual({2:20, 3:20, 4:20, 5:20});
    });

    test('Incorrect answer forces to answer tasks from the same rule', () => {
        suggester.recordAnswer(2, false);
        const suggestedTaskIdxs = new Set<number>();
        for (let count = 0; count < 9; count ++ ) {
            const nextTaskIdx = suggester.suggestNextTask().taskIdx;
            suggester.recordAnswer(nextTaskIdx, true);
            suggestedTaskIdxs.add(nextTaskIdx);
        }
        expect(suggestedTaskIdxs).toStrictEqual(new Set([2,3,5,4]));
    });

    test('Cleanup drops incorrectly answered memory', () => {
      suggester.recordAnswer(2, false);
      suggester.clearStats();
      const suggestedTaskIdxs = new Set<number>();
      for (let count = 0; count < 900; count ++ ) {
          const nextTaskIdx = suggester.suggestNextTask().taskIdx;
          suggestedTaskIdxs.add(nextTaskIdx);
      }
      expect(suggestedTaskIdxs).toStrictEqual(new Set([0,1,2,3,4,5,6,7]));
  });

    test('When answered incorrectly and then correctly several times, the enforcement to answer only specific rule goes away', () => {
        suggester.recordAnswer(2, false);
        const suggestedTaskIdxs = new Set<number>();
        for (let count = 0; count < 900; count ++ ) {
            const nextTaskIdx = suggester.suggestNextTask().taskIdx;
            suggester.recordAnswer(nextTaskIdx, true);
            suggestedTaskIdxs.add(nextTaskIdx);
        }
        expect(suggestedTaskIdxs).toStrictEqual(new Set([0,1,2,3,5,4,6,7]));
    });

});                