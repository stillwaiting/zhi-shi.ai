import { extractSelectedRulIdxsFromPath } from './pathutils';

describe('pathutils', () => {

    describe('extractSelectedRulIdxsFromPath', () => {
        test('parses simple ruleIdx', () => {
            expect(extractSelectedRulIdxsFromPath('5')).toStrictEqual([5]);
        });

        test('parses simple ruleIdx with prefix /', () => {
            expect(extractSelectedRulIdxsFromPath('/5')).toStrictEqual([5]);
        });

        test('parses simple ruleIdx with suffix', () => {
            expect(extractSelectedRulIdxsFromPath('/5/settings')).toStrictEqual([5]);
        });

        test('parses simple region of ruleIdxs', () => {
            expect(extractSelectedRulIdxsFromPath('/5-7')).toStrictEqual([5, 6, 7]);
        });

        test('parses combination of regions and single numbers', () => {
            expect(extractSelectedRulIdxsFromPath('/5-7,9-10,15/blah')).toStrictEqual([5, 6, 7, 9, 10, 15]);
        });

        test('parses empty string as empty array', () => {
            expect(extractSelectedRulIdxsFromPath('/')).toStrictEqual([]);
        });

        test('parses path without regions as empty array', () => {
            expect(extractSelectedRulIdxsFromPath('settings')).toStrictEqual([]);
        });

        test('parses prefixed path without regions as empty array', () => {
            expect(extractSelectedRulIdxsFromPath('/settings')).toStrictEqual([]);
        });
    });
});