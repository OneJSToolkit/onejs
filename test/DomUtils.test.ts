/// <reference path="../../definitions/definitions.d.ts" />

import chai = require("chai");
import List = require("../../src/lib/List");
import DomUtils = require("../../src/lib/DomUtils");

var expect = chai.expect;
var assert = chai.assert;

describe('DomUtils', function() {
    describe('toggleClass', () => {
        var el: HTMLDivElement;

        beforeEach(() => {
            el = document.createElement('div');
        });

        describe('when isEnabled=true', () => {
            it('adds a class to a DOM element with no classes', () => {
                DomUtils.toggleClass(el, 'foo', true);
                expect(el.className).to.equal('foo');
            });

            it('adds a class to a DOM element with some classes', () => {
                el.className = 'bar'
                DomUtils.toggleClass(el, 'foo', true);
                expect(el.className).to.equal('bar foo');
            });
        });

        describe('when isEnabled=false', () => {
            it('does not add a class to a DOM element with no classes', () => {
                DomUtils.toggleClass(el, 'foo', false);
                expect(el.className).to.equal('');
            });

            it('removes a class from a DOM element', () => {
                el.className = 'foo bar'
                DomUtils.toggleClass(el, 'foo', false);
                expect(el.className).to.equal('bar');
            });
        });
    });

    describe('setText', () => {
        it('should set the text of the given element', () => {
            var el = document.createElement('div');
            var text = 'sample text';
            assert.strictEqual(el.innerText, '');
            DomUtils.setText(el, text);
            assert.strictEqual(el.innerText, text);
        });
    });

    describe('ce', () => {
        it('creates a basic element', () => {
            var tag = DomUtils.ce('span');
            expect(tag.tagName.toLowerCase()).to.equal('span');
        });

        it('sets attributes', () => {
            var tag = DomUtils.ce('span', { 'data-foo': 'bar', 'data-baz': 'boz' });

            expect(tag.getAttribute('data-foo')).to.equal('bar');
            expect(tag.getAttribute('data-baz')).to.equal('boz');
        });

        it('sets the children, if passed in', () => {
            var childNode1 = DomUtils.ce('p');
            var childNode2 = DomUtils.ce('h1');
            var root = DomUtils.ce('div', {}, [childNode1, childNode2]);
            var childNodes = root.childNodes;
            assert.strictEqual(childNodes.length, 2);
            assert.strictEqual(childNodes[0], childNode1);
            assert.strictEqual(childNodes[1], childNode2);
        });
    });

    describe('ct', () => {
        it('creates a text node', () => {
            var text = 'sample text';
            var createdNode = DomUtils.ct(text);
            assert.strictEqual(createdNode instanceof Text, true);
            assert.strictEqual(createdNode.data, text);
        });
    });

    describe('createComment', () => {
        it('creates a comment node', () => {
            var text = 'sample text';
            var createdNode = DomUtils.createComment(text);
            assert.strictEqual(createdNode instanceof Comment, true);
            assert.strictEqual(createdNode.data, text);
        });
    });
});
