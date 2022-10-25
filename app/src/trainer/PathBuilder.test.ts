import { PathBuilder } from './PathBuilder';

describe('pathutils', () => {
    
    describe('buildPath', () => {

        test('no number, no screen', () => {
            expect(new PathBuilder('').buildPath()).toBe('/');
        });

        test('no number, has screen', () => {
            expect(new PathBuilder('').setScreen('blah').buildPath()).toBe('/blah');
        });

        test('single number, no screen', () => {
            expect(new PathBuilder('').setSelection(new Set([6])).buildPath()).toBe('/rules/6');
        });

        test('single number, with screen', () => {
            expect(new PathBuilder('')
                .setSelection(new Set([6]))
                .setScreen('blah')
            .buildPath()).toBe('/rules/6/blah');
        });

        test('region, no screen', () => {
            expect(new PathBuilder('').setSelection(new Set([6, 7, 8])).buildPath()).toBe('/rules/6-8');
        });

        test('region, with screen', () => {
            expect(new PathBuilder('')
                .setSelection(new Set([6, 7, 8]))
                .setScreen('blah')
            .buildPath()).toBe('/rules/6-8/blah');
        });

        test('mixture regions and numbers, no screen', () => {
            expect(new PathBuilder('')
                .setSelection(new Set([6, 7, 8, 10, 14, 15]))
            .buildPath()).toBe('/rules/6-8,10,14-15');
        });

        test('mixture regions and numbers, with screen', () => {
            expect(new PathBuilder('')
                .setSelection(new Set([6, 7, 8, 10, 14, 15]))
                .setScreen('blah')
            .buildPath()).toBe('/rules/6-8,10,14-15/blah');
        });

        
    });

    describe('parsing', () => {
        test('parses simple ruleIdx', () => {
            expect(new PathBuilder('rules/5').getRules()).toStrictEqual(new Set([5]));
        });

        test('parses simple ruleIdx with prefix /', () => {
            expect(new PathBuilder('/rules/5').getRules()).toStrictEqual(new Set([5]));
        });

        test('parses simple ruleIdx with suffix', () => {
            expect(new PathBuilder('/rules/5/settings').getRules()).toStrictEqual(new Set([5]));
            expect(new PathBuilder('/rules/5/settings').getScreen()).toStrictEqual('settings');
        });

        test('parses simple region of ruleIdxs', () => {
            expect(new PathBuilder('rules/5-7').getRules()).toStrictEqual(new Set([5, 6, 7]));
        });

        test('parses combination of regions and single numbers', () => {
            expect(new PathBuilder('/rules/5-7,9-10,15/blah').getRules()).toStrictEqual(new Set([5, 6, 7, 9, 10, 15]));
        });

        test('parses empty string as empty array', () => {
            expect(new PathBuilder('/').getRules()).toStrictEqual(new Set([]));
        });

        test('parses path without regions as empty array', () => {
            expect(new PathBuilder('settings').getScreen()).toStrictEqual('settings');
        });

        test('parses task', () => {
            expect(new PathBuilder('/task/1-2/settings').getTask()).toStrictEqual({
                ruleIdx: 1,
                ruleTaskIdx: 2
            });
        });
    });
});