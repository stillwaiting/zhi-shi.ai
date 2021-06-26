import mdParse from './MarkdownParser';

describe('mdParse', () => {
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
            body: {
                content: '',
            },
            children: []
        }]);
    });

    test('adds parent path', () => {
        expect(mdParse('# hello world!', ['parent'])).toStrictEqual([{
            title: 'hello world!',
            path: ['parent', 'hello world!'],
            body: {
                content: '',
            },
            children: []
        }]);
    });

    test('parses title and body only', () => {
        expect(mdParse(
`# hello world!

this is my shiny body
`, [])).toStrictEqual([{
            title: 'hello world!',
            path: ['hello world!'],
            body: {
                content: 'this is my shiny body',
            },
            children: []
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
            body: {
                content: "this is my shiny body\nmultiline!",
            },
            children: []
        }]);
    });

    test('parses two titles without bodies', () => {
        expect(mdParse(
`# hello world!

# and the second one
`, [])).toStrictEqual([{
            title: 'hello world!',
            path: ['hello world!'],
            body: {
                content: "",
            },
            children: []
        }, {
            title: 'and the second one',
            path: ['and the second one'],
            body: {
                content: "",
            },
            children: []
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
            body: {
                content: "first body",
            },
            children: []
        }, {
            title: 'and the second one',
            path: ['and the second one'],
            body: {
                content: "second body\nmultiline",
            },
            children: []
        }, {
            title: 'and the third one without body',
            path: ['and the third one without body'],
            body: {
                content: "",
            },
            children: []
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
            body: {
                content: "first body",
            },
            children: [{
                title: 'first child',
                path: ['hello world!', 'first child'],
                body: {
                    content: 'first child\'s body',
                },
                children: []
            }, {
                title: 'second child',
                path: ['hello world!', 'second child'],
                body: {
                    content: 'second child\'s body\nmultiline'
                },
                children: []
            }, {
                title: 'third child without body',
                path: ['hello world!', 'third child without body'],
                body: {
                    content: ''
                },
                children: []
            }]
        }, {
            title: 'another top level item',
            path: ['another top level item'],
            body: {
                content: "",
            },
            children: []
        }]);
    });
});