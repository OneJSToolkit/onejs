/// <reference path="../definitions/definitions.d.ts" />

import chai = require("chai");
var assert = chai.assert;
import Block = require('../src/Block');
import BlockProcessor = require('../src/BlockProcessor');
import BlockType = require('../src/BlockType');
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

    describe('#IfBlock', function () {

        it('should not render when source is false', function () {
            view.setData({ condition: false });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.IfBlock,
                        source: "condition",
                        children: [{ type: BlockType.Text, value: "cat" }]
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
            view.setData({ condition: true });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.IfBlock,
                        source: "condition",
                        children: [{ type: BlockType.Text, value: "cat" }]
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.IfBlock,
                        source: "condition",
                        children: [{ type: BlockType.Text, value: "cat" }]
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.IfBlock,
                        source: "condition",
                        children: [
                            { type: BlockType.Text, value: "dog" },
                            { type: BlockType.Text, value: "cat" }
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.IfBlock,
                        source: "cat",
                        children: [{ type: BlockType.Text, value: "cat" }]
                    },
                    {
                        type: BlockType.IfBlock,
                        source: "dog",
                        children: [{ type: BlockType.Text, value: "dog" }]
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.IfBlock,
                        source: "condition",
                        children: [{ type: BlockType.Text, value: "cat" }]
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.IfBlock,
                        source: "condition",
                        children: [{
                            type: BlockType.Element,
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
            view.setData({ condition: true, checked: false });
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.IfBlock,
                        source: "condition",
                        children: [{
                            type: BlockType.Element,
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.IfBlock,
                        source: "condition",
                        children: [{
                            type: BlockType.Element,
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
            var block = BlockProcessor.fromSpec(view, {
                type: BlockType.Element,
                tag: "div",
                children: [
                    {
                        type: BlockType.IfBlock,
                        source: "condition",
                        children: [{
                            type: BlockType.IfBlock,
                            source: "condition",
                            children: [{ type: BlockType.Text, value: "cat" }]
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

});