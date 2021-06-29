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
                text: ['abc']
            }]
        });
    });

    test('parses multiple lines', () => {
        expect(parseBody('abc\nqwe')).toStrictEqual({
            content: [{
                text: ['abc qwe']
            }]
        });
    });

    test('parses several paragraphs', () => {
        expect(parseBody('abc\nqwe\n\nfoo\nbar')).toStrictEqual({
            content: [{
                text: ['abc qwe']
            }, {
                text: ['foo bar']
            }]
        });
    });

    test('one line simple unordered list', () => {
        expect(parseBody('- hello')).toStrictEqual({
            content: [{
                isOrdered: false,
                start: '-',
                items: [{
                    content: [{
                        text: ['hello']
                    }]
                }]
            }]
        });
    });
    test('two line simple unordered list', () => {
        expect(parseBody('- hello\n  world')).toStrictEqual({
            content: [{
                isOrdered: false,
                start: '-',
                items: [{
                    content: [{
                        text: ['hello world']
                    }]
                }]
            }]
        });
    });

    test('two simple unordered list', () => {
        expect(parseBody('- hello\n  world\n- another one')).toStrictEqual({
            content: [{
                isOrdered: false,
                start: '-',
                items: [{
                    content: [{
                        text: ['hello world']
                    }]
                },{
                    content: [{
                        text: ['another one']
                    }]
                }]
            }]
        });
    });

    test('nexted unordered lists', () => {
        expect(parseBody(
`
- hello
  world
  - this is a new
    list
- and then back
  to the old one
`            
        )).toStrictEqual({
            content: [{
                isOrdered: false,
                start: "-",
                items: [{
                    content: [{
                        text: ["hello world"],
                    }, {
                        isOrdered: false,
                        items: [{
                            content: [{
                                text: ["this is a new list"],
                            }],
                        }],
                        start: "-",
                    }],
                }, {
                    content: [{
                        text: ["and then back to the old one"],
                    }],
                }]
            }]
        });
    });

    test('switching between text and list', () => {
        expect(parseBody(
`
some 
test
- list
next text
`)).toStrictEqual({
            "content": [{
                "text": ["some test"]
            }, {
                "isOrdered": false,
                "items": [{
                    "content": [{
                        "text": ["list"]
                    }]
                }],
                "start": "-"
            }, {
                "text": ["next text"]
            }]
        });
    });

    test('one line simple ordered list', () => {
        expect(parseBody('1. hello')).toStrictEqual({
            content: [{
                isOrdered: true,
                start: '1',
                items: [{
                    content: [{
                        text: ['hello']
                    }]
                }]
            }]
        });
    });
    
    test('two line simple ordered list', () => {
        expect(parseBody('1. hello\n   world')).toStrictEqual({
            content: [{
                isOrdered: true,
                start: '1',
                items: [{
                    content: [{
                        text: ['hello world']
                    }]
                }]
            }]
        });
    });

    test('simple ordered list size 2', () => {
        expect(parseBody('1. hello\n   world\n2. another one')).toStrictEqual({
            content: [{
                isOrdered: true,
                start: '1',
                items: [{
                    content: [{
                        text: ['hello world']
                    }]
                },{
                    content: [{
                        text: ['another one']
                    }]
                }]
            }]
        });
    });

    test('nexted ordered lists', () => {
        expect(parseBody(
`
1. hello
   world
   1. this is a new
      list
2. and then back
   to the old one
`            
        )).toStrictEqual({
            content: [{
                isOrdered: true,
                start: "1",
                items: [{
                    content: [{
                        text: ["hello world"],
                    }, {
                        isOrdered: true,
                        items: [{
                            content: [{
                                text: ["this is a new list"],
                            }],
                        }],
                        start: "1",
                    }],
                }, {
                    content: [{
                        text: ["and then back to the old one"],
                    }],
                }],
            }]
        });
    });


});