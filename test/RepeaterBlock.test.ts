/// <reference path="../definitions/definitions.d.ts" />

import chai = require("chai");
var assert = chai.assert;
import BaseView = require('../src/BaseView');
import Block = require('../src/Block');
import BlockProcessor = require('../src/BlockProcessor');
import BlockType = require('../src/BlockType');
import View = require('../src/View');
import ViewModel = require('../src/ViewModel');
import List = require('../src/List');

class TestView extends BaseView {

    viewModelType = TestViewModel;
    
    onPostRender() {
        this.element.textContent = "Test";
    }
}

class TestViewModel extends ViewModel {
    upper(text: string): string {
        return text.toUpperCase();
    }
}

describe('Block', function () {

    var view: View;

    beforeEach(function () {
        view = new View();
    });

    afterEach(function () {
        view.dispose();
        view = undefined;
    });

    describe('#RepeaterBlock', function () {

        it('should render contents immediately', function () {
            view.setData({ data: new List([{ val: 1 }, { val: 2 }, { val: 3 }]) });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "item.val"
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.children.length, 3);
            assert.strictEqual(div.textContent, '123');
            block.dispose();
        });

        it('should work with plain arrays', function () {
            view.setData({ data: [{ val: 1 }, { val: 2 }, { val: 3 }] });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "item.val"
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '123');
            block.dispose();
        });

        it('should work with an array that is updated', function () {
            view.setData({ data: [{ val: 1 }, { val: 2 }, { val: 3 }] });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "item.val"
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '123');
            view.setData({ data: [{ val: 4 }, { val: 5 }, { val: 6 }] });
            block.update();
            assert.strictEqual(div.textContent, '456');
            block.dispose();
        });

        it('should work with empty values', function () {
            view.setData({ data: null });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "item.val"
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '');
            block.dispose();
        });

        it('should work with bare values', function () {
            view.setData({ data: { val: 42 } });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "item.val"
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '42');
            block.dispose();
        });

        it('should render inserted items', function () {
            var list = new List([]);
            view.setData({ data: list });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "item.val"
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '');

            list.push({ val: 1 });
            assert.strictEqual(div.textContent, '1');

            list.insertAt(0, { val: 2 });
            assert.strictEqual(div.textContent, '21');

            list.insertAt(1, { val: 3 });
            assert.strictEqual(div.textContent, '231');

            list.push({ val: 4 });
            assert.strictEqual(div.textContent, '2314');

            block.dispose();
        });

        it('should remove removed items', function () {
            var list = new List([{ val: 1 }, { val: 2 }, { val: 3 }]);
            view.setData({ data: list });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "item.val"
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '123');

            list.removeAt(1);
            assert.strictEqual(div.textContent, '13');

            list.removeAt(0);
            assert.strictEqual(div.textContent, '3');

            list.pop();
            assert.strictEqual(div.textContent, '');

            block.dispose();
        });

        it('should handle changed items', function () {
            var list = new List([{ val: 1 }, { val: 2 }, { val: 3 }]);
            view.setData({ data: list });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "item.val"
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '123');

            list.setAt(1, { val: 9 });
            assert.strictEqual(div.textContent, '193');

            block.dispose();
        });

        it('should handle changed items with keys', function () {
            var list = new List([{ key: "a", val: 1 }, { key: "b", val: 2 }, { key: "c", val: 3 }]);
            view.setData({ data: list });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "item.val"
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '123');

            list.setAt(1, { key: "d", val: 9 });
            assert.strictEqual(div.textContent, '193');

            block.dispose();
        });

        it('should insert correctly with multiple children', function () {
            view.setData({ data: new List([{ val: 1 }, { val: 2 }, { val: 3 }]) });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [
                            {
                                type: BlockType.Element,
                                tag: "div",
                                children: [{ type: BlockType.Text, value: "*" }]
                            },
                            {
                                type: BlockType.Element,
                                tag: "div",
                                binding: {
                                    text: "item.val"
                                }
                            }
                        ]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.children.length, 6);
            assert.strictEqual(div.textContent, '*1*2*3');
            block.dispose();
        });

        it('should support nesting repeaters', function () {
            var list1 = new List([{ val: 1 }, { val: 2 }, { val: 3 }]);
            var list2 = new List([{ val: 4 }, { val: 5 }, { val: 6 }]);
            view.setData({ list1: list1, list2: list2 });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "list1",
                        iterator: "item",
                        children: [
                            {
                                type: BlockType.Element,
                                tag: "div",
                                binding: {
                                    text: "item.val"
                                }
                            },
                            {
                                type: BlockType.RepeaterBlock,
                                source: "list2",
                                iterator: "item2",
                                children: [
                                    {
                                        type: BlockType.Element,
                                        tag: "span",
                                        binding: {
                                            text: "item.val"
                                        }
                                    },
                                    {
                                        type: BlockType.Element,
                                        tag: "span",
                                        binding: {
                                            text: "item2.val"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '114151622425263343536');
            block.dispose();
        });

        it('should support nesting repeaters that share a block template', function () {
            var groups = [
                {
                    name: 'group 1',
                    items: [{ name: 'foo' }, { name: 'bar' }]
                },
                {
                    name: 'group 2',
                    items: [{ name: 'baz' }, { name: 'boz' }]
                },
                {
                    name: 'group 3',
                    items: []
                }
            ];
            view.setData({ groups: groups });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "groups",
                        iterator: "group",
                        children: [
                            {
                                type: BlockType.Element,
                                tag: "h1",
                                binding: {
                                    text: "group.name"
                                }
                            },
                            {
                                type: BlockType.Element,
                                tag: "ul",
                                children: [{
                                    type: BlockType.RepeaterBlock,
                                    source: "group.items",
                                    iterator: "item",
                                    children: [{
                                        type: BlockType.Element,
                                        tag: "li",
                                        binding: {
                                            text: "item.name"
                                        }
                                    }]
                                }]
                            }
                        ]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'group 1foobargroup 2bazbozgroup 3');
            block.dispose();
        });

        it('should support shadowing parent iterator', function () {
            var list1 = new List([{ val: 1 }, { val: 2 }, { val: 3 }]);
            var list2 = new List([{ val: 4 }, { val: 5 }, { val: 6 }]);
            view.setData({ list1: list1, list2: list2 });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "list1",
                        iterator: "item",
                        children: [
                            {
                                type: BlockType.RepeaterBlock,
                                source: "list2",
                                iterator: "item",
                                children: [
                                    {
                                        type: BlockType.Element,
                                        tag: "span",
                                        binding: {
                                            text: "item.val"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '456456456');
            block.dispose();
        });

        it('should support lists of lists', function () {
            var list = new List([{ val: new List([{ val: 4 }, { val: 5 }, { val: 6 }]) }]);
            view.setData({ list: list });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "list",
                        iterator: "item",
                        children: [
                            {
                                type: BlockType.RepeaterBlock,
                                source: "item.val",
                                iterator: "item",
                                children: [
                                    {
                                        type: BlockType.Element,
                                        tag: "span",
                                        binding: {
                                            text: "item.val"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '456');
            block.dispose();
        });

        it('should support calling functions with the iterator', function () {
            view.setData({ data: new List([{ val: 1 }]) });
            view['multiplyBy3'] = function (arg) {
                return arg * 3;
            };
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "$view.multiplyBy3(item.val)"
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '3');
            block.dispose();
        });

        it('should support ifs inside of repeaters', function () {
            view.setData({ data: new List([{ val: true }, { val: false }]) });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.IfBlock,
                            source: "item.val",
                            children: [{
                                type: BlockType.Text,
                                value: "visible"
                            }]
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'visible');
            block.dispose();
        });

        it('should support calling view functions with the iterator', function () {
            var data = [{ val: true }];
            view.setData({ data: data });

            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                events: { 'click': ["$toggle('item.val')"] }
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();

            var root = block.elements[0];
            assert.strictEqual(root.children.length, 1);
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            root.children[0].dispatchEvent(event);
            assert.strictEqual(data[0].val, false);
            block.dispose();
        });

        it('should support subviews', function () {

            view['subView'] = TestView;
            view.setData({ data: new List([{ val: 1 }, { val: 2 }, { val: 3 }]) });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "item.val"
                            }
                        }, {
                            type: BlockType.View,
                            name: "subView"
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '1Test2Test3Test');
            assert.strictEqual(view.children.length, 3);
            block.dispose();
        });

        it('should lifecycle views correctly', function () {

            view['subView'] = TestView;
            var list = new List([]);
            view.setData({ data: list});
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.View,
                            name: "subView"
                        }]
                    }
                ]
            });

            block.render();
            block.bind();
            
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '');
            assert.strictEqual(view.children.length, 0);

            list.push({ val: 1 });
            assert.strictEqual(div.textContent, 'Test');
            assert.strictEqual(view.children.length, 1);
            var child = <BaseView> view.children[0];
            assert.strictEqual(child.isActive, true);
            list.pop();
            assert.strictEqual(view.children.length, 0);
            assert.strictEqual(child.isActive, false);
            assert.strictEqual(child.isDisposed, true);
            

            block.dispose();
        });

        it('should add subviews to block scope', function () {

            view['subView'] = TestView;
            view.setData({ data: new List([{ val: 'hey' }, { val: 'hi' }, { val: 'yo' }]) });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: BlockType.Element,
                            tag: "div",
                            binding: {
                                text: "subView.upper(item.val)"
                            }
                        }, {
                                type: BlockType.View,
                                name: "subView"
                            }]
                    }
                ]
            });

            block.render();
            block.bind();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'HEYTestHITestYOTest');
            assert.strictEqual(view.children.length, 3);
            block.dispose();
        });
    });

});