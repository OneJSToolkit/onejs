/// <reference path="../definitions/definitions.d.ts" />

import chai = require("chai");
var assert = chai.assert;
import Block = require('../src/Block');

describe('Block', function () {

    describe('#Block', function () {
        it('should render an element', function () {
            var block = Block.fromSpec({
                type: Block.BlockType.Element,
                tag: "div"
            });

            block.render();
            assert.strictEqual(block.elements.length, 1);
            assert.instanceOf(block.elements[0], HTMLDivElement);
        });

        it('should not render until called', function () {
            var block = Block.fromSpec({
                type: Block.BlockType.Element,
                tag: "div"
            });

            assert.strictEqual(block.elements.length, 0);
            block.render();
            assert.strictEqual(block.elements.length, 1);
        });

        it('should render an element with attributes set', function () {
            var block = Block.fromSpec({
                type: Block.BlockType.Element,
                tag: "div",
                attr: {
                    'class': "cat"
                }
            });

            block.render();
            assert.strictEqual(block.elements[0].className, 'cat');
        });

        it('should render an element with children', function () {
            var block = Block.fromSpec({
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

        });

        it('should render sibling elements', function () {
            var block = Block.fromSpec({
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

        });

        it('should render a text node', function () {
            var block = Block.fromSpec({
                type: Block.BlockType.Text,
                value: "cat"
            });

            block.render();
            assert.instanceOf(block.elements[0], Text);
            assert.strictEqual(block.elements[0].textContent, 'cat');
        });

        it('should render an element containing a text node', function () {
            var block = Block.fromSpec({
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
        });
    });

    describe('#Block binding', function () {
        it("should bind to the view's ViewModel", function () {
        });

        it('should bind className', function () {
        });

        it('should bind css', function () {
        });

        it('should bind text', function () {
        });

        it('should bind html', function () {
        });

        it('should bind attributes', function () {
        });

        it('should bind events', function () {
        });
    });

    describe('#IfBlock', function () {

        it('should not render when source is false', function () {
            var block = Block.fromSpec({
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
        });

        it('should render immediately when source is true', function () {
        });

        it('should render after source becomes true', function () {
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