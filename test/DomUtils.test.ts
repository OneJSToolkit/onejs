/// <reference path="../definitions/definitions.d.ts" />

import chai = require("chai");
import List = require("../src/List");
import DomUtils = require("../src/DomUtils");

var expect = chai.expect;

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

    describe('ce', () => {
        it('creates a basic element', () => {
            var tag = DomUtils.ce('span');
            expect(tag.tagName.toLowerCase()).to.equal('span');
        });

        it('sets attributes', () => {
            var tag = DomUtils.ce('span', ['data-foo', 'bar', 'data-baz', 'boz']);

            expect(tag.getAttribute('data-foo')).to.equal('bar');
            expect(tag.getAttribute('data-baz')).to.equal('boz');
        });
    });
});
