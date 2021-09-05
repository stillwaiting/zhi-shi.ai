import { extractSelectedRuleIdxsFromPath } from './pathutils';

describe('pathutils', () => {

    describe('extractSelectedRuleIdxsFromPath', () => {
        test('parses simple ruleIdx', () => {
            expect(extractSelectedRuleIdxsFromPath('5')).toStrictEqual([5]);
        });

        test('parses simple ruleIdx with prefix /', () => {
            expect(extractSelectedRuleIdxsFromPath('/5')).toStrictEqual([5]);
        });

        test('parses simple ruleIdx with suffix', () => {
            expect(extractSelectedRuleIdxsFromPath('/5/settings')).toStrictEqual([5]);
        });

        test('parses simple region of ruleIdxs', () => {
            expect(extractSelectedRuleIdxsFromPath('/5-7')).toStrictEqual([5, 6, 7]);
        });

        test('parses combination of regions and single numbers', () => {
            expect(extractSelectedRuleIdxsFromPath('/5-7,9-10,15/blah')).toStrictEqual([5, 6, 7, 9, 10, 15]);
        });

        test('parses empty string as empty array', () => {
            expect(extractSelectedRuleIdxsFromPath('/')).toStrictEqual([]);
        });

        test('parses path without regions as empty array', () => {
            expect(extractSelectedRuleIdxsFromPath('settings')).toStrictEqual([]);
        });

        test('parses prefixed path without regions as empty array', () => {
            expect(extractSelectedRuleIdxsFromPath('/settings')).toStrictEqual([]);
        });
    });
});