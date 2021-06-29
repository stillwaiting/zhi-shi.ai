import mdParse from './MarkdownParser';

const EMPTY_BODY = {
    content: [],
};

function generateBody(line) {
    return {
        content: [
            {
                text: line
            }
        ],
    }
}

describe('MarkdownParser', () => {
    test('parses empty string', () => {
        expect(mdParse("", [])).toHaveLength(0);
    });

    test('trims whitespaces', () => {
        expect(mdParse("   ", [])).toHaveLength(0);
    });

    test('throws an exception if not starting with #', () => {
        expect(() => mdParse("hello", [])).toThrow("must start with #")
    })

    test('parses empty title', () => {
        expect(mdParse('#', [])).toStrictEqual([]);
    });

    test('parses empty title only', () => {
        expect(mdParse('# hello world!', [])).toStrictEqual([{
            title: 'hello world!',
            path: ['hello world!'],
            body: EMPTY_BODY,
            children: [],
            childrenByTitleIndex: {}
        }]);
    });

    test('adds parent path', () => {
        expect(mdParse('# hello world!', ['parent'])).toStrictEqual([{
            title: 'hello world!',
            path: ['parent', 'hello world!'],
            body: EMPTY_BODY,
            children: [],
            childrenByTitleIndex: {}
        }]);
    });

    test('parses title and body only', () => {
        expect(mdParse(
`# hello world!

this is my shiny body
`, [])).toStrictEqual([{
            title: 'hello world!',
            path: ['hello world!'],
            body: generateBody('this is my shiny body'),
            children: [],
            childrenByTitleIndex: {}
        }]);
    });

    test('parses title and multiline body', () => {
        expect(mdParse(
`# hello world!

this is my shiny body
multiline!
`, [])).toStrictEqual([{
            title: 'hello world!',
            path: ['hello world!'],
            body: generateBody("this is my shiny body multiline!"),
            children: [],
            childrenByTitleIndex: {}
        }]);
    });

    test('parses two titles without bodies', () => {
        expect(mdParse(
`# hello world!

# and the second one
`, [])).toStrictEqual([{
            title: 'hello world!',
            path: ['hello world!'],
            body: EMPTY_BODY,
            children: [],
            childrenByTitleIndex: {}
        }, {
            title: 'and the second one',
            path: ['and the second one'],
            body: EMPTY_BODY,
            children: [],
            childrenByTitleIndex: {}
        }]);
    });

    test('parses bodies with and without bodies', () => {
        expect(mdParse(
`# hello world!

first body

# and the second one

second body
multiline   

# and the third one without body
`, [])).toStrictEqual([{
            title: 'hello world!',
            path: ['hello world!'],
            body: generateBody("first body"),
            children: [],
            childrenByTitleIndex: {}
        }, {
            title: 'and the second one',
            path: ['and the second one'],
            body: generateBody("second body multiline"),
            children: [],
            childrenByTitleIndex: {}
        }, {
            title: 'and the third one without body',
            path: ['and the third one without body'],
            body: EMPTY_BODY,
            children: [],
            childrenByTitleIndex: {}
        }]);
    });

    test('parses child nodes, too', () => {
        expect(mdParse(
`# hello world!

first body

## first child

first child's body

## second child

second child's body
multiline

## third child without body

# another top level item
`, [])).toStrictEqual([{
            title: 'hello world!',
            path: ['hello world!'],
            body: generateBody("first body"),
            childrenByTitleIndex: {
                'first child': 0,
                'second child': 1,
                'third child without body': 2
            },
            children: [{
                title: 'first child',
                path: ['hello world!', 'first child'],
                body: generateBody('first child\'s body'),
                children: [],
                childrenByTitleIndex: {}
            }, {
                title: 'second child',
                path: ['hello world!', 'second child'],
                body: generateBody('second child\'s body multiline'),
                children: [],
                childrenByTitleIndex: {}
            }, {
                title: 'third child without body',
                path: ['hello world!', 'third child without body'],
                body: EMPTY_BODY,
                children: [],
                childrenByTitleIndex: {}
            }]
        }, {
            title: 'another top level item',
            path: ['another top level item'],
            body: EMPTY_BODY,
            children: [],
            childrenByTitleIndex: {}
        }]);
    });
});