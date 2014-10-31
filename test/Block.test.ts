/// <reference path="../definitions/definitions.d.ts" />

import chai = require("chai");
var assert = chai.assert;
import Block = require('../src/Block');
import BaseView = require('../src/BaseView');
import View = require('../src/View');
import List = require('../src/List');

describe('Block', function () {

    var view: View;

    beforeEach(function () {
        view = new View();
    });

    afterEach(function () {
        view.dispose();
        view = undefined;
    });

    describe('#Block', function () {
        it('should render an element', function () {
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div"
            });

            block.render();
            assert.strictEqual(block.elements.length, 1);
            assert.instanceOf(block.elements[0], HTMLDivElement);
            block.dispose();
        });

        it('should not render until called', function () {
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div"
            });

            assert.isUndefined(block.elements);
            block.render();
            assert.strictEqual(block.elements.length, 1);
            block.dispose();
        });

        it('should render an element with attributes set', function () {
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                attr: {
                    'class': "cat"
                }
            });

            block.render();
            assert.strictEqual(block.elements[0].className, 'cat');
            block.dispose();
        });

        it('should render an element with children', function () {
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.Element,
                        tag: "span"
                    },
                    {
                        type: Block.BlockType.Element,
                        tag: "p"
                    }
                ]
            });

            block.render();
            var div = block.elements[0];
            assert.strictEqual(div.children.length, 2);
            assert.strictEqual(div.children[0].tagName, 'SPAN');
            assert.strictEqual(div.children[1].tagName, 'P');
            block.dispose();

        });

        it('should render sibling elements', function () {
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Block,
                children: [
                    {
                        type: Block.BlockType.Element,
                        tag: 'div',
                        children: [{type: Block.BlockType.Text, value: "1"}]
                    },
                    {
                        type: Block.BlockType.Element,
                        tag: 'div',
                        children: [{ type: Block.BlockType.Text, value: "2" }]
                    }
                ]
            });

            block.render();
            assert.strictEqual(block.elements.length, 2);
            assert.strictEqual(block.elements[0].textContent, '1');
            assert.strictEqual(block.elements[1].textContent, '2');
            block.dispose();

        });

        it('should render a text node', function () {
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Text,
                value: "cat"
            });

            block.render();
            assert.instanceOf(block.elements[0], Text);
            assert.strictEqual(block.elements[0].textContent, 'cat');
            block.dispose();
        });

        it('should render an element containing a text node', function () {
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.Text,
                        value: "cat"
                    }
                ]
            });

            block.render();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'cat');
            block.dispose();
        });

        it('should render a subview', function () {
            var subView = new BaseView();
            subView.element = document.createElement("div")
            view.addChild(subView);
            view['subView'] = subView;

            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.View,
                        name: "subView"
                    }
                ]
            });

            block.render();
            var div = block.elements[0]
            assert.strictEqual(div.children[0], subView.element);
            block.dispose();
        });
    });

    describe('#Block binding', function () {
        
        it("should bind text", function () {
            view.setData({ pet: 'dog' });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                binding: {
                    text: 'pet'
                }
            });

            block.render();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'dog');
            block.dispose();
        });

        it('should bind className', function () {
            view.setData({ error: true });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                binding: {
                    className: { 'alert': 'error' }
                }
            });

            block.render();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.classList.contains('alert'), true);
            block.dispose();
        });

        it('should bind css', function () {
            view.setData({ display: 'none' });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                binding: {
                    css: { 'display': 'display' }
                }
            });

            block.render();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.style.display, 'none');
            block.dispose();
        });

        it('should bind html', function () {
            view.setData({ markup: '<span>dog</span>' });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                binding: {
                    html: 'markup'
                }
            });

            block.render();
            block.update();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'dog');
            assert.strictEqual(div.children.length, 1);
            assert.strictEqual(div.children[0].tagName, 'SPAN');
            block.dispose();
        });

        it('should bind attributes', function () {
            view.setData({ value: 'hello', readonly: true });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "input",
                binding: {
                    attr: {
                        value: 'value',
                        readonly: 'readonly'
                    }
                }
            });

            block.render();
            block.update();
            var input = <HTMLInputElement>block.elements[0];
            assert.strictEqual(input.value, 'hello');
            assert.strictEqual(input.readOnly, true);
            block.dispose();
        });

        it('should bind events', function () {
            var callbackValue;
            view.setData({
                customMethod: function (arg) {
                    callbackValue = arg;
                }
            });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                binding: {
                    events: { 'click': ["customMethod('dog')"]}
                }
            });

            block.render();
            block.bind();
            var div = block.elements[0];
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            div.dispatchEvent(event);
            assert.strictEqual(callbackValue, 'dog');
            block.dispose();
        });

        it('should perform two-way binding', function () {
            view.setData({ value: 'hello'});
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "input",
                binding: {
                    attr: {
                        value: 'value',
                    }
                }
            });

            block.render();
            block.bind();
            block.update();
            var input = <HTMLInputElement>block.elements[0];
            assert.strictEqual(input.value, 'hello');
            input.value = 'good bye';
            var event = document.createEvent('HTMLEvents');
            event.initEvent('change', true, true);
            input.dispatchEvent(event);
            assert.strictEqual(view.getValue('value'), 'good bye');
            block.dispose();

        });
    });

    describe('#IfBlock', function () {

        it('should not render when source is false', function () {
            view.setData({ condition: false });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.IfBlock,
                        source: "condition",
                        children: [{ type: Block.BlockType.Text, value: "cat" }]
                    }
                ]
            });

            block.render();
            var div = block.elements[0];
            assert.strictEqual(div.children.length, 0);
            assert.strictEqual(div.childNodes.length, 1);
            assert.strictEqual(block.children.length, 1);
            assert.strictEqual(div.childNodes[0], block.children[0].placeholder);
            assert.strictEqual(div.textContent, '');
            block.dispose();
        });

        it('should render immediately when source is true', function () {
            view.setData({condition: true});
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.IfBlock,
                        source: "condition",
                        children: [{ type: Block.BlockType.Text, value: "cat" }]
                    }
                ]
            });

            block.render();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'cat');
            block.dispose();
        });

        it('should render after source becomes true', function () {
            view.setData({ condition: false });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.IfBlock,
                        source: "condition",
                        children: [{ type: Block.BlockType.Text, value: "cat" }]
                    }
                ]
            });

            block.render();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '');
            view.setData({ condition: true });
            block.update();
            assert.strictEqual(div.textContent, 'cat');
            block.dispose();
        });

        it('should render child elements in proper order', function () {
            view.setData({ condition: true });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.IfBlock,
                        source: "condition",
                        children: [
                            { type: Block.BlockType.Text, value: "dog" },
                            { type: Block.BlockType.Text, value: "cat" }
                        ]
                    }
                ]
            });

            block.render();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'dogcat');
            block.dispose();
        });

        it('should render sibling ifs in proper order', function () {
            view.setData({ cat: false, dog: false });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.IfBlock,
                        source: "cat",
                        children: [{ type: Block.BlockType.Text, value: "cat" }]
                    },
                    {
                        type: Block.BlockType.IfBlock,
                        source: "dog",
                        children: [{ type: Block.BlockType.Text, value: "dog" }]
                    }
                ]
            });

            block.render();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, '');
            view.setData({ dog: true });
            block.update();
            assert.strictEqual(div.textContent, 'dog');
            view.setData({ cat: true });
            block.update();
            assert.strictEqual(div.textContent, 'catdog');
            block.dispose();
        });

        it('should remove elements after source becomes false', function () {
            view.setData({ condition: true });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.IfBlock,
                        source: "condition",
                        children: [{ type: Block.BlockType.Text, value: "cat" }]
                    }
                ]
            });

            block.render();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'cat');
            view.setData({ condition: false });
            block.update();
            assert.strictEqual(div.textContent, '');
            block.dispose();
        });

        it('should render when updated', function () {
            view.setData({ condition: false, pet: "cat" });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.IfBlock,
                        source: "condition",
                        children: [{
                            type: Block.BlockType.Element,
                            tag: "div",
                            binding: {
                                text: 'pet'
                            }
                        }]
                    }
                ]
            });

            block.render();

            view.setData({ condition: true });

            block.update();

            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'cat');
            block.dispose();
        });

        it('should bind immediately if already rendered', function () {
            view.setData({ condition: true, checked: false});
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.IfBlock,
                        source: "condition",
                        children: [{
                            type: Block.BlockType.Element,
                            tag: "input",
                            attr: { "type": "checkbox" },
                            binding: {
                                attr: {
                                    checked: 'checked'
                                }
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();

            var input = <HTMLInputElement>block.elements[0].children[0];
            assert.isFalse(input.checked);
            input.checked = true;
            var event = document.createEvent('HTMLEvents');
            event.initEvent('change', true, true);
            input.dispatchEvent(event);
            assert.strictEqual(view.getValue('checked'), true);
            block.dispose();
        });

        it('should bind lazily after rendering occurs', function () {
            view.setData({ condition: false, checked: false });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.IfBlock,
                        source: "condition",
                        children: [{
                            type: Block.BlockType.Element,
                            tag: "input",
                            attr: { "type": "checkbox" },
                            binding: {
                                attr: {
                                    checked: 'checked'
                                }
                            }
                        }]
                    }
                ]
            });

            block.render();
            block.bind();

            view.setData({ condition: true });
            block.update();

            var input = <HTMLInputElement>block.elements[0].children[0];
            assert.isFalse(input.checked);
            input.checked = true;
            var event = document.createEvent('HTMLEvents');
            event.initEvent('change', true, true);
            input.dispatchEvent(event);
            assert.strictEqual(view.getValue('checked'), true);
            block.dispose();
        });

        it('should support nested ifs', function () {
            view.setData({ condition: true });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.IfBlock,
                        source: "condition",
                        children: [{
                            type: Block.BlockType.IfBlock,
                            source: "condition",
                            children: [{ type: Block.BlockType.Text, value: "cat" }]
                        }]
                    }
                ]
            });

            block.render();
            var div = block.elements[0];
            assert.strictEqual(div.textContent, 'cat');
            block.dispose();
        });

    });

    describe('#RepeaterBlock', function () {

        it('should render contents immediately', function () {
            view.setData({ data: new List([{ val: 1 }, { val: 2 }, { val: 3 }]) });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: Block.BlockType.Element,
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
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: Block.BlockType.Element,
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

        it('should render inserted items', function () {
            var list = new List([]);
            view.setData({ data: list });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: Block.BlockType.Element,
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
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: Block.BlockType.Element,
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
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: Block.BlockType.Element,
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
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: Block.BlockType.Element,
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
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [
                            {
                                type: Block.BlockType.Element,
                                tag: "div",
                                children: [{type: Block.BlockType.Text, value: "*"}]
                            },
                            {
                                type: Block.BlockType.Element,
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
            view.setData({ list1: list1, list2: list2  });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "list1",
                        iterator: "item",
                        children: [
                            {
                                type: Block.BlockType.Element,
                                tag: "div",
                                binding: {
                                    text: "item.val"
                                }
                            },
                            {
                                type: Block.BlockType.RepeaterBlock,
                                source: "list2",
                                iterator: "item2",
                                children: [
                                    {
                                        type: Block.BlockType.Element,
                                        tag: "span",
                                        binding: {
                                            text: "item.val"
                                        }
                                    },
                                    {
                                        type: Block.BlockType.Element,
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

        it('should support shadowing parent iterator', function () {
            var list1 = new List([{ val: 1 }, { val: 2 }, { val: 3 }]);
            var list2 = new List([{ val: 4 }, { val: 5 }, { val: 6 }]);
            view.setData({ list1: list1, list2: list2 });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "list1",
                        iterator: "item",
                        children: [
                            {
                                type: Block.BlockType.RepeaterBlock,
                                source: "list2",
                                iterator: "item",
                                children: [
                                    {
                                        type: Block.BlockType.Element,
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
            var list = new List([{ val: new List([{ val: 4 }, { val: 5 }, { val: 6 }])}]);
            view.setData({ list: list });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "list",
                        iterator: "item",
                        children: [
                            {
                                type: Block.BlockType.RepeaterBlock,
                                source: "item.val",
                                iterator: "item",
                                children: [
                                    {
                                        type: Block.BlockType.Element,
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
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: Block.BlockType.Element,
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
            view.setData({ data: new List([{ val: true }, {val: false}]) });
            var block = Block.fromSpec(view, {
                type: Block.BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: Block.BlockType.RepeaterBlock,
                        source: "data",
                        iterator: "item",
                        children: [{
                            type: Block.BlockType.IfBlock,
                            source: "item.val",
                            children: [{
                                type: Block.BlockType.Text,
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
    });

});