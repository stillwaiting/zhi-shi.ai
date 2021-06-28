import parseBody from './MarkdownBodyParser'
describe('MarkdownBodyParser', () => {

    test('parses empty body', () => {
        expect(parseBody('')).toStrictEqual({
            content: []
        });
    });

    test('parses single line', () => {
        expect(parseBody('abc')).toStrictEqual({
            content: [{
                chunks: [],
                rawLines: [
                    'abc'
                ]
            }]
        });
    });

    test('parses multiple lines', () => {
        expect(parseBody('abc\nqwe')).toStrictEqual({
            content: [{
                chunks: [],
                rawLines: [
                    'abc', 'qwe'
                ]
            }]
        });
    });

    test('parses several paragraphs', () => {
        expect(parseBody('abc\nqwe\n\nfoo\nbar')).toStrictEqual({
            content: [{
                chunks: [],
                rawLines: [
                    'abc', 'qwe'
                ]
            }, {
                chunks: [],
                rawLines: [
                    'foo', 'bar'
                ]
            }]
        });
    });
});