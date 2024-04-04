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
        expect(mdParse("", [])).toStrictEqual({
          parsedNodes: [],
          indexedNodes: {},
          errors: [],
        });
    });

    test('trims whitespaces', () => {
        expect(mdParse("   ", [])).toStrictEqual({
          parsedNodes: [],
          indexedNodes: {},
          errors: [],
        });
    });

    test('throws an exception if not starting with #', () => {
        expect(() => mdParse("hello", [])).toThrow("must start with #")
    })

    test('parses empty title', () => {
        expect(mdParse('#', [])).toStrictEqual({
          parsedNodes: [],
          indexedNodes: {},
          errors: [],
        });
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
        expect(mdParse('# hello world!', [])).toStrictEqual({
          parsedNodes: [expected],
          indexedNodes: {['hello world!']: expected},
          errors: [],
        });
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
        expect(mdParse('# hello world!', ['parent'])).toStrictEqual({
          parsedNodes: [expected],
          indexedNodes: {['hello world!']: expected},
          errors: [],
        });
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
`, []).parsedNodes).toStrictEqual([expected]);
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
`, []).parsedNodes).toStrictEqual([expected]);
    });

    test('parses two titles without bodies', () => {
        expect(mdParse(
`# hello world!

# and the second one
`, []).parsedNodes).toStrictEqual([{
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
`, []).parsedNodes).toStrictEqual([{
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
`, []).parsedNodes).toStrictEqual([{
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

  {set:hello-2}
  foo2
  bar2
  {/set}

  {hello}
  
## child

  {set:world}
  baz $1
  blah $2
  {/set}
  
  
  {hello}
  {hello-2}
  {world|first|second}
  `, []);
        expect(parsedBody.parsedNodes).toStrictEqual([
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
                "hello": "\n  foo\n  bar\n  ",
                "hello-2": "\n  foo2\n  bar2\n  "
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
                        "text": "foo bar foo2 bar2 baz first blah second"
                      }
                    ]
                  },
                  "nodeTemplateVariables": {
                    "hello": "\n  foo\n  bar\n  ",
                    "hello-2": "\n  foo2\n  bar2\n  ",
                    "world": "\n  baz $1\n  blah $2\n  "
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

      test('indexes by node title', () => {
        const parsedBody = mdParse(`
# hello
helloBody
# hello2
helloBody2
## child
childBody
  `, []);
        expect(parsedBody.indexedNodes['hello']).toStrictEqual(parsedBody.parsedNodes[0]);
        expect(parsedBody.indexedNodes['hello2']).toStrictEqual(parsedBody.parsedNodes[1]);
        expect(parsedBody.indexedNodes['child']).toStrictEqual(parsedBody.parsedNodes[1].children[0]);
      });

      test('errors out when duplicate nodes', () => {
        const parsedBody = mdParse(`
# hello
helloBody
# hello2
helloBody2
## hello
childBody
  `, []);
        expect(parsedBody.errors).toStrictEqual(["Node with duplicated title: hello"]);
      });


      test('validates correctness of connections', () => {
        const parsedBody = mdParse(`
# hello
{connected: hello34}
# hello2
helloBody2
## hello3
childBody
  `, []);
        expect(parsedBody.errors).toStrictEqual(["Cannot find connected node hello34 for hello"]);
      });

      test('creates reciprocal connections when missing', () => {
        const parsedBody = mdParse(`
# hello
{connected: hello3}
# hello2
helloBody2
## hello3
childBody
  `, []);
        expect(parsedBody.indexedNodes['hello3'].body.content[1]).toStrictEqual({
          connectedNodeTitle: 'hello',
          isAutogenerated: true
        });
      });

      test('does not create reciprocal connections when already exists missing', () => {
        const parsedBody = mdParse(`
# hello
{connected: hello3}
# hello2
helloBody2
## hello3
childBody
{connected: hello}
  `, []);
        expect(parsedBody.indexedNodes['hello3'].body.content[1]).toStrictEqual({
          connectedNodeTitle: 'hello',
          isAutogenerated: false
        });
        expect(parsedBody.indexedNodes['hello3'].body.content.length).toStrictEqual(2);
      });

      test('supports nested templates', () => {
        const parsedBody = mdParse(`
# hello
  {set:hello}
  foo
  {/set}

  {set:world}
   {hello} world!
  {/set}

  {world}
  `, []);
        expect(parsedBody.parsedNodes).toStrictEqual([
          {
            "title": "hello",
            "path": [
              "hello"
            ],
            "body": {
              "content": [
                {
                  "text": "foo world!"
                }
              ]
            },
            "nodeTemplateVariables": {
              "hello": "\n  foo\n  ",
              "world": "\n   foo world!\n  "
            },
            "children": [],
            "childrenByTitleIndex": {}
          }
        ]);
      });

      test('skips escaped templates', () => {
        const parsedBody = mdParse(`
# hello
  {set:hello}
  foo
  bar
  {/set}

  \\{hello}
  world
  `, []);
        expect(parsedBody.parsedNodes).toStrictEqual([
          {
            "title": "hello",
            "path": [
              "hello"
            ],
            "body": {
              "content": [
                {
                  "text": "\\{hello} world"
                }
              ]
            },
            "nodeTemplateVariables": {
              "hello": "\n  foo\n  bar\n  "
            },
            "children": [],
            "childrenByTitleIndex": {}
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
        expect(result.parsedNodes).toStrictEqual([
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