import mdParse from './MarkdownParser';
import { MarkdownBody, MarkdownNode } from './types';

const EMPTY_BODY: MarkdownBody = {
    content: []
};

function generateBody(line: string): MarkdownBody {
    return {
        content: [
            {
                text: line
            }
        ]
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
        const expected: MarkdownNode = {
            title: 'hello world!',
            path: ['hello world!'],
            body: EMPTY_BODY,
            nodeTemplateVariables: {},
            children: [],
            childrenByTitleIndex: {}
        };
        expect(mdParse('# hello world!', [])).toStrictEqual([expected]);
    });

    test('adds parent path', () => {
        const expected: MarkdownNode = {
            title: 'hello world!',
            path: ['parent', 'hello world!'],
            body: EMPTY_BODY,
            nodeTemplateVariables: {},
            children: [],
            childrenByTitleIndex: {}
        };
        expect(mdParse('# hello world!', ['parent'])).toStrictEqual([expected]);
    });

    test('parses title and body only', () => {
        const expected: MarkdownNode = {
            title: 'hello world!',
            path: ['hello world!'],
            body: generateBody('this is my shiny body'),
            nodeTemplateVariables: {},
            children: [],
            childrenByTitleIndex: {}
        };
        expect(mdParse(
`# hello world!

this is my shiny body
`, [])).toStrictEqual([expected]);
    });

    test('parses title and multiline body', () => {
        const expected: MarkdownNode = {
            title: 'hello world!',
            path: ['hello world!'],
            body: generateBody("this is my shiny body multiline!"),
            nodeTemplateVariables: {},
            children: [],
            childrenByTitleIndex: {}
        };
        expect(mdParse(
`# hello world!

this is my shiny body
multiline!
`, [])).toStrictEqual([expected]);
    });

    test('parses two titles without bodies', () => {
        expect(mdParse(
`# hello world!

# and the second one
`, [])).toStrictEqual([{
            title: 'hello world!',
            path: ['hello world!'],
            body: EMPTY_BODY,
            nodeTemplateVariables: {},
            children: [],
            childrenByTitleIndex: {}
        }, {
            title: 'and the second one',
            path: ['and the second one'],
            body: EMPTY_BODY,
            nodeTemplateVariables: {},
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
            nodeTemplateVariables: {},
            children: [],
            childrenByTitleIndex: {}
        }, {
            title: 'and the second one',
            path: ['and the second one'],
            body: generateBody("second body multiline"),
            nodeTemplateVariables: {},
            children: [],
            childrenByTitleIndex: {}
        }, {
            title: 'and the third one without body',
            path: ['and the third one without body'],
            body: EMPTY_BODY,
            nodeTemplateVariables: {},
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
            nodeTemplateVariables: {},
            childrenByTitleIndex: {
                'first child': 0,
                'second child': 1,
                'third child without body': 2
            },
            children: [{
                title: 'first child',
                path: ['hello world!', 'first child'],
                body: generateBody('first child\'s body'),
                nodeTemplateVariables: {},
                children: [],
                childrenByTitleIndex: {}
            }, {
                title: 'second child',
                path: ['hello world!', 'second child'],
                body: generateBody('second child\'s body multiline'),
                nodeTemplateVariables: {},
                children: [],
                childrenByTitleIndex: {}
            }, {
                title: 'third child without body',
                path: ['hello world!', 'third child without body'],
                body: EMPTY_BODY,
                nodeTemplateVariables: {},
                children: [],
                childrenByTitleIndex: {}
            }]
        }, {
            title: 'another top level item',
            path: ['another top level item'],
            body: EMPTY_BODY,
            nodeTemplateVariables: {},
            children: [],
            childrenByTitleIndex: {}
        }]);
    });

    test('parses templates', () => {
        const parsedBody = mdParse(`
# hello
  {set:hello}
  foo
  bar
  {/set}

  {hello}
  
## child

  {set:world}
  baz
  blah
  {/set}
  
  
  {hello}
  {world}
  `, []);
        expect(parsedBody).toStrictEqual([
            {
              "title": "hello",
              "path": [
                "hello"
              ],
              "body": {
                "content": [
                  {
                    "text": "foo bar"
                  }
                ]
              },
              "nodeTemplateVariables": {
                "hello": "\n  foo\n  bar\n  "
              },
              "children": [
                {
                  "title": "child",
                  "path": [
                    "hello",
                    "child"
                  ],
                  "body": {
                    "content": [
                      {
                        "text": "foo bar baz blah"
                      }
                    ]
                  },
                  "nodeTemplateVariables": {
                    "hello": "\n  foo\n  bar\n  ",
                    "world": "\n  baz\n  blah\n  "
                  },
                  "children": [],
                  "childrenByTitleIndex": {}
                }
              ],
              "childrenByTitleIndex": {
                "child": 0
              }
            }
          ]);
      });

    test('parses without body but with children correctly', () => {
        const content = 
`# Части речи

## Существительное

## Rule: имена существительные собственные и нарицательные

https://russkiiyazyk.ru/chasti-rechi/sushhestvitelnoe/chto-takoe-imya-suschestvitelnoe.html#i-4
`;
        const result = mdParse(content, []);
        expect(result).toStrictEqual([
            {
              "body": {
                "content": []
              },
              nodeTemplateVariables: {},
              "children": [
                {
                  "body": {
                    "content": []
                  },
                  nodeTemplateVariables: {},
                  "children": [],
                  "childrenByTitleIndex": {},
                  "path": [
                    "Части речи",
                    "Существительное"
                  ],
                  "title": "Существительное"
                },
                {
                  "body": {
                    "content": [
                      {
                        "text": "https://russkiiyazyk.ru/chasti-rechi/sushhestvitelnoe/chto-takoe-imya-suschestvitelnoe.html#i-4"
                      },
                    ],
                  },
                  nodeTemplateVariables: {},
                  "children": [],
                  "childrenByTitleIndex": {},
                  "path": [
                    "Части речи",
                    "Rule: имена существительные собственные и нарицательные"
                  ],
                  "title": "Rule: имена существительные собственные и нарицательные"
                }
              ],
              "childrenByTitleIndex": {
                "Rule: имена существительные собственные и нарицательные": 1,
                "Существительное": 0
              },
              "path": [
                "Части речи"
              ],
              "title": "Части речи"
            }
          ]);
    });
});