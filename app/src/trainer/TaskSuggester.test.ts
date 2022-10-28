import TaskSuggester from './TaskSuggester';

describe('TaskSuggester', () => {

    let suggester!: TaskSuggester;

    beforeEach(() => {
        suggester = new TaskSuggester(`
   
# Root 1

## SubNode 1


### NR: ignore

#### Task ignored task

? -1 Hello (foo|bar)
! world

### Rule -1: empty rule, no tasks

### Rule 0: single tasks node

#### Task  node 0

Some text that should be ignored.

? 0 Hello (foo|bar)
! world

? 1 Bar baz (hello|world)
! hello

### Rule 1: several task nodes

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

## NR: some rule that is not ready yet

### Task should not be there

? 6 (Hello|bye)
! hello


## Rule 2: another root

### Task node 3

Some text that should be ignored.

? 6 (Hello|bye)
! hello

? 7 (Cat|Dog)
! cat

## TODO: not visib

### Task blahblah

? 6 (Hello|bye)
! hello


## NR: not visible too

### Task foo blah

? 6 (Hello|bye)
! hello


# TODO: fooo

## Rule: not visible

### Task not visible

? 6 (Hello|bye)
! hello


        
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
              "correctlyAnsweredTaskIdxs": new Set([]),
              "incorrectlyAnsweredTaskIdxs": new Set([])
            },
            "rules": [
              {
                "ruleIdx": 0,
                "topicIdx": 0,
                "nodeTitle": "Rule 0: single tasks node",
                "stats": {
                  "totalTasks": 2,
                  "correctlyAnsweredTaskIdxs": new Set([]),
                  "incorrectlyAnsweredTaskIdxs": new Set([])
                },
                "taskIdxs": [
                  0,
                  1
                ],
                "lastAnsweredNodeTitles": [],
                "lastAnsweredTaskIdxs": {}
              },
              {
                "ruleIdx": 1,
                "topicIdx": 0,
                "nodeTitle": "Rule 1: several task nodes",
                "stats": {
                  "totalTasks": 4,
                  "correctlyAnsweredTaskIdxs": new Set([]),
                  "incorrectlyAnsweredTaskIdxs": new Set([])
                },
                "taskIdxs": [
                  2,
                  3,
                  4,
                  5
                ],
                "lastAnsweredNodeTitles": [],
                "lastAnsweredTaskIdxs": {}
              }
            ]
          },
          {
            "topicIdx": 1,
            "title": "Root 2",
            "stats": {
              "totalTasks": 2,
              "correctlyAnsweredTaskIdxs": new Set([]),
              "incorrectlyAnsweredTaskIdxs": new Set([])
            },
            "rules": [
              {
                "ruleIdx": 2,
                "topicIdx": 1,
                "nodeTitle": "Rule 2: another root",
                "stats": {
                  "totalTasks": 2,
                  "correctlyAnsweredTaskIdxs": new Set([]),
                  "incorrectlyAnsweredTaskIdxs": new Set([])
                },
                "taskIdxs": [
                  6,
                  7
                ],
                "lastAnsweredNodeTitles": [],
                "lastAnsweredTaskIdxs": {}
              }
            ]
          }
        ]);
    });

    test('Selected rules limit the choice of tasks', () => {
        suggester.setSelectedRuleIdxs(new Set<number>([2]));
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
        const nextTaskIdx = suggester.suggestNextTask().taskIdx;
        suggester.recordAnswer(nextTaskIdx, true);
        for (let count = 0; count < 100; count ++ ) {
            expect(suggester.suggestNextTask().taskIdx).not.toBe(nextTaskIdx);
        }
    });

    test('Answer updates statistis', () => {
        suggester.recordAnswer(0, true);
        expect(suggester.getTopics()[0].stats.correctlyAnsweredTaskIdxs.size).toBe(1);
        expect(suggester.getTopics()[0].rules[0].stats.correctlyAnsweredTaskIdxs.size).toBe(1);
    });

    test('Clean statistics cleans statistis', () => {
      suggester.recordAnswer(0, true);
      suggester.clearStats();
      expect(suggester.getTopics()[0].stats.correctlyAnsweredTaskIdxs.size).toBe(0);
      expect(suggester.getTopics()[0].rules[1].stats.correctlyAnsweredTaskIdxs.size).toBe(0);
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
      for (let attempts = 0; attempts < 10000; attempts ++) {
        suggestedTaskIdx.add(suggester.suggestNextTask().taskIdx);
      }
      expect(suggestedTaskIdx).toStrictEqual(new Set<number>([0,1,2,3,4,5,6,7]));
    });

    test('The answered task is added back to the pool when all other tasks are answered, too', () => {
        suggester.setSelectedRuleIdxs(new Set<number>([1]));
        const stats: {[taskIdx:number] : number} = {};
        for (let count = 0; count < 80; count ++ ) {
            const nextTaskIdx = suggester.suggestNextTask().taskIdx;
            suggester.recordAnswer(nextTaskIdx, true);
            stats[nextTaskIdx] = stats[nextTaskIdx] ? stats[nextTaskIdx] + 1 : 1;
        }
        expect(stats[2]).toBeGreaterThan(10);
        expect(stats[3]).toBeGreaterThan(10);
        expect(stats[4]).toBeGreaterThan(10);
        expect(stats[5]).toBeGreaterThan(10);
    });

    test('Incorrect answer forces to answer tasks from the same title', () => {
        suggester.recordAnswer(2, false);
        suggester.recordAnswer(3, true);
        const suggestedTaskIdxs = new Set<number>();
        for (let count = 0; count < 90; count ++ ) {
            const nextTaskIdx = suggester.suggestNextTask().taskIdx;
            suggester.recordAnswer(nextTaskIdx, false);
            suggestedTaskIdxs.add(nextTaskIdx);
        }
        expect(suggestedTaskIdxs).toStrictEqual(new Set([2,3]));
    });

    test('Incorrect answer forces to answer tasks from the same rule', () => {
      suggester.recordAnswer(2, false);
      suggester.recordAnswer(3, true);
      suggester.recordAnswer(4, true);
      suggester.recordAnswer(5, true);
      suggester.recordAnswer(2, true);
      suggester.recordAnswer(3, true);
      const suggestedTaskIdxs = new Set<number>();
      for (let count = 0; count < 90; count ++ ) {
          const nextTaskIdx = suggester.suggestNextTask().taskIdx;
          suggestedTaskIdxs.add(nextTaskIdx);
      }
      expect(suggestedTaskIdxs).toStrictEqual(new Set([2,3, 5,4]));
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

  test('Rule cleanup removes items only of the selected rule', () => {
    suggester.recordAnswer(0, false);
    suggester.recordAnswer(1, true);
    suggester.recordAnswer(2, false);
    suggester.recordAnswer(3, true);

    suggester.clearStatsForRules(new Set([0]));
    expect(suggester.getTopics()[0].stats.correctlyAnsweredTaskIdxs).toStrictEqual(new Set([3]));
    expect(suggester.getTopics()[0].stats.incorrectlyAnsweredTaskIdxs).toStrictEqual(new Set([2]));
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

  test('getRuleTask returns correct data', () => {
    const task = suggester.getRuleTask(1, 0);
    expect(task.bodyChunk.question.text).toEqual("2 blah (a|b)");
  });

});                