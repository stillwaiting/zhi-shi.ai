import { buildPath, extractSelectedRuleIdxsFromPath } from './pathutils';

describe('pathutils', () => {
    
    describe('buildPath', () => {

        test('no number, no screen', () => {
            expect(buildPath(new Set([]), '')).toBe('/');
        });

        test('no number, has screen', () => {
            expect(buildPath(new Set([]), 'blah')).toBe('/blah');
        });


        test('single number, no screen', () => {
            expect(buildPath(new Set([6]), '')).toBe('/6');
        });

        test('single number, with screen', () => {
            expect(buildPath(new Set([6]), 'blah')).toBe('/6/blah');
        });

        test('region, no screen', () => {
            expect(buildPath(new Set([6, 7, 8]), '')).toBe('/6-8');
        });

        test('region, with screen', () => {
            expect(buildPath(new Set([6, 7, 8]), 'blah')).toBe('/6-8/blah');
        });

        test('mixture regions and numbers, no screen', () => {
            expect(buildPath(new Set([6, 7, 8, 10, 14, 15]), '')).toBe('/6-8,10,14-15');
        });

        test('mixture regions and numbers, with screen', () => {
            expect(buildPath(new Set([6, 7, 8, 10, 14, 15]), 'blah')).toBe('/6-8,10,14-15/blah');
        });
    });

    describe('extractSelectedRuleIdxsFromPath', () => {
        test('parses simple ruleIdx', () => {
            expect(extractSelectedRuleIdxsFromPath('5')).toStrictEqual(new Set([5]));
        });

        test('parses simple ruleIdx with prefix /', () => {
            expect(extractSelectedRuleIdxsFromPath('/5')).toStrictEqual(new Set([5]));
        });

        test('parses simple ruleIdx with suffix', () => {
            expect(extractSelectedRuleIdxsFromPath('/5/settings')).toStrictEqual(new Set([5]));
        });

        test('parses simple region of ruleIdxs', () => {
            expect(extractSelectedRuleIdxsFromPath('/5-7')).toStrictEqual(new Set([5, 6, 7]));
        });

        test('parses combination of regions and single numbers', () => {
            expect(extractSelectedRuleIdxsFromPath('/5-7,9-10,15/blah')).toStrictEqual(new Set([5, 6, 7, 9, 10, 15]));
        });

        test('parses empty string as empty array', () => {
            expect(extractSelectedRuleIdxsFromPath('/')).toStrictEqual(new Set([]));
        });

        test('parses path without regions as empty array', () => {
            expect(extractSelectedRuleIdxsFromPath('settings')).toStrictEqual(new Set([]));
        });

        test('parses prefixed path without regions as empty array', () => {
            expect(extractSelectedRuleIdxsFromPath('/settings')).toStrictEqual(new Set([]));
        });
    });
});