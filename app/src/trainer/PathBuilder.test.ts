import Hasher from './Hasher';
import { PathBuilder } from './PathBuilder';

const hasher = new Hasher();
[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(ruleIdx =>
    // @ts-ignore
    hasher.addRule({
        ruleIdx,
        nodeTitle: "number" + ruleIdx
    })
);

hasher.addTask({
    taskIdx: 1,
    // @ts-ignore
    bodyChunk: {
        question: {
            text: 'question'
        }
    }
});

describe('pathutils', () => {
    
    describe('buildPath', () => {
        


        test('no number, no screen', () => {
            expect(new PathBuilder('', hasher).buildPath()).toBe('/');
        });

        test('no number, has screen', () => {
            expect(new PathBuilder('', hasher).setScreen('blah').buildPath()).toBe('/blah');
        });

        test('single number, no screen', () => {
            expect(new PathBuilder('', hasher).setSelection(new Set([6])).buildPath()).toBe('/rules/2b0a82');
        });

        test('single number, with screen', () => {
            expect(new PathBuilder('', hasher)
                .setSelection(new Set([6]))
                .setScreen('blah')
            .buildPath()).toBe('/rules/2b0a82/blah');
        });

        test('region, no screen', () => {
            expect(new PathBuilder('', hasher).setSelection(new Set([6, 7, 8])).buildPath()).toBe('/rules/2b0a82-31f84b');
        });

        test('region, with screen', () => {
            expect(new PathBuilder('', hasher)
                .setSelection(new Set([6, 7, 8]))
                .setScreen('blah')
            .buildPath()).toBe('/rules/2b0a82-31f84b/blah');
        });

        test('mixture regions and numbers, no screen', () => {
            expect(new PathBuilder('', hasher)
                .setSelection(new Set([6, 7, 8, 10, 14, 15]))
            .buildPath()).toBe('/rules/2b0a82-31f84b,941c4b,e936f1-f48506');
        });

        test('mixture regions and numbers, with screen', () => {
            expect(new PathBuilder('', hasher)
                .setSelection(new Set([6, 7, 8, 10, 14, 15]))
                .setScreen('blah')
            .buildPath()).toBe('/rules/2b0a82-31f84b,941c4b,e936f1-f48506/blah');
        });
        
        test('mixture regions and numbers, with screen and task', () => {
            expect(new PathBuilder('', hasher)
                .setSelection(new Set([6, 7, 8, 10, 14, 15]))
                .setTaskIdx(1)
                .setScreen('blah')
            .buildPath()).toBe('/rules/2b0a82-31f84b,941c4b,e936f1-f48506/task/1f5087/blah');
        });
        
    });

    describe('parsing', () => {

        test('parses simple ruleIdx', () => {
            expect(new PathBuilder('rules/' + hasher.ruleIdxToHash(5), hasher).getRules()).toStrictEqual(new Set([5]));
        });

        test('parses simple ruleIdx with prefix /', () => {
            expect(new PathBuilder('/rules/' + hasher.ruleIdxToHash(5), hasher).getRules()).toStrictEqual(new Set([5]));
        });

        test('parses simple ruleIdx with suffix', () => {
            expect(new PathBuilder('/rules/' + hasher.ruleIdxToHash(5) + '/settings', hasher).getRules()).toStrictEqual(new Set([5]));
            expect(new PathBuilder('/rules/' + hasher.ruleIdxToHash(5) + '/settings', hasher).getScreen()).toStrictEqual('settings');
        });

        test('parses simple region of ruleIdxs', () => {
            expect(new PathBuilder('rules/' + hasher.ruleIdxToHash(5) + '-' + hasher.ruleIdxToHash(7), hasher).getRules()).toStrictEqual(new Set([5, 6, 7]));
        });

        test('parses combination of regions and single numbers', () => {
            expect(new PathBuilder(
                `/rules/${hasher.ruleIdxToHash(5)}-${hasher.ruleIdxToHash(7)},` + 
                `${hasher.ruleIdxToHash(9)}-${hasher.ruleIdxToHash(10)},` +
                `${hasher.ruleIdxToHash(15)}/blah`, hasher).getRules()).toStrictEqual(new Set([5, 6, 7, 9, 10, 15]));
        });

        test('parses empty string as empty array', () => {
            expect(new PathBuilder('/', hasher).getRules()).toStrictEqual(new Set([]));
        });

        test('parses path without regions as empty array', () => {
            expect(new PathBuilder('settings', hasher).getScreen()).toStrictEqual('settings');
        });

        test('parses task', () => {
            expect(new PathBuilder('/task/' + hasher.taskIdxToHash(1) + '/settings', hasher).getTaskIdx()).toStrictEqual(1);
        });
    });

    describe('setters', () => {
        it('should set all the things', () => {
            const pathBuilder = new PathBuilder('', hasher);
            expect(
                pathBuilder.setScreen('foo').setSelection(new Set([5,6])).setTaskIdx(1).buildPath()
            ).toEqual('/rules/35cbe8-2b0a82/task/1f5087/foo');
        });
    })
});