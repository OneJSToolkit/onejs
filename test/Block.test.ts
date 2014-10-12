/// <reference path="../definitions/definitions.d.ts" />

import chai = require("chai");
var assert = chai.assert;
import Block = require('../src/Block');
import View = require('../src/View');

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
    });

    describe('#RepeaterBlock', function () {

        it('should render contents immediately', function () {
        });

        it('should render inserted items', function () {
        });

        it('should dispose removed items', function () {
        });

        it('should allow binding to the iterator', function () {
        });

        it('should support nesting repeaters', function () {
        });

        it('should support shadowing parent iterator', function () {
        });
    });

});