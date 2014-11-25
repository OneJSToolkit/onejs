/// <reference path="../typings/tsd.d.ts" />

import chai = require("chai");
var assert = chai.assert;
import chai = require("chai");
var assert = chai.assert;
import Block = require('../../src/lib/Block');
import IBinding = require('../../src/lib/IBinding');
import Binding = require('../../src/lib/Binding');
import BlockProcessor = require('../../src/lib/BlockProcessor');
import BlockType = require('../../src/lib/BlockType');
import BaseView = require('../../src/lib/BaseView');
import View = require('../../src/lib/View');
import EventGroup = require('../../src/lib/EventGroup');

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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div"
            });

            block.render();
            assert.strictEqual(block.elements.length, 1);
            assert.instanceOf(block.elements[0], HTMLDivElement);
            block.dispose();
        });

        it('should not render until called', function () {
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div"
            });

            assert.isUndefined(block.elements);
            block.render();
            assert.strictEqual(block.elements.length, 1);
            block.dispose();
        });

        it('should render an element with attributes set', function () {
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.Element,
                        tag: "span"
                    },
                    {
                        type: BlockType.Element,
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Block,
                children: [
                    {
                        type: BlockType.Element,
                        tag: 'div',
                        children: [{type: BlockType.Text, value: "1"}]
                    },
                    {
                        type: BlockType.Element,
                        tag: 'div',
                        children: [{ type: BlockType.Text, value: "2" }]
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Text,
                value: "cat"
            });

            block.render();
            assert.instanceOf(block.elements[0], Text);
            assert.strictEqual(block.elements[0].textContent, 'cat');
            block.dispose();
        });

        it('should render an element containing a text node', function () {
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.Text,
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

            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.View,
                        name: "subView"
                    }
                ]
            });

            block.render();
            var div = block.elements[0]
            assert.strictEqual(div.children[0], subView.element);
            block.dispose();
        });

        it('should render a subview with bindings', function () {
            var subView = new BaseView();
            subView.element = document.createElement("div")
            view.addChild(subView);
            view['subView'] = subView;
            var callbackCalled = false;
            view['callback'] = function () {
                callbackCalled = true;
            }

            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.View,
                        name: "subView",
                        binding: {
                            events: {
                                'test': ['$callback']
                            }
                        }
                    }
                ]
            });

            block.render();
            block.bind();
            var div = block.elements[0]
            EventGroup.raise(subView.element, 'test');
            assert.strictEqual(callbackCalled, true);
            block.dispose();
        });
    });

    describe('#Block binding', function () {

        it("should bind text", function () {
            view.setData({ pet: 'dog' });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
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

        it('handles nonstandard prototypes', function() {
            String.prototype['foo'] = () => {};

            var block = new Block(view, null);

            var bindingDesc: IBinding = {};
            bindingDesc['id'] = '0';

            block.bindings.push(new Binding('0', null, bindingDesc));
            block.update();

            delete String.prototype['foo'];
        });
    });

});
