/// <reference path="../../typings/tsd.d.ts" />

import chai = require("chai");
import View = require("../../src/lib/View");
import Block = require("../../src/lib/Block");
import BlockType = require('../../src/lib/BlockType');

var assert = chai.assert;

describe('View', function () {

    describe('Blocks Integration', function () {
        it('should render simple elements', function () {
            var view = new View();
            view._spec = {
                type: BlockType.Element,
                tag: "div",
                children: [{type: BlockType.Text, value: "Hello!"}]
            };

            var root = view.render();
            view.activate();

            assert.strictEqual(view.element, root);
            assert.strictEqual(root.textContent, 'Hello!');
            view.dispose();
        });

        it('should render bound elements', function () {
            var view = new View();
            view.setData({ pet: "cat" });
            view._spec = {
                type: BlockType.Element,
                tag: "div",
                binding: {
                    text: "pet"
                }
            };

            var root = view.render();
            view.activate();

            assert.strictEqual(root.textContent, 'cat');
            view.dispose();
        });

        it('should react to VM updates', function () {
            var view = new View();
            view.setData({ pet: "cat" });
            view._spec = {
                type: BlockType.Element,
                tag: "div",
                binding: {
                    text: "pet"
                }
            };

            var root = view.render();
            view.activate();

            assert.strictEqual(root.textContent, 'cat');

            view.setData({ pet: "dog" });
            assert.strictEqual(root.textContent, 'dog');


            view.dispose();

        });

        it('should not require a spec', function () {
            var view = new View();

            var root = view.render();
            view.activate();

            assert.strictEqual(root.tagName, 'DIV');
            assert.strictEqual(root.textContent, '');

            view.dispose();

        });
    });

    describe('#_getPropTarget', function() {
        it('should return an object', function() {
            // The any type is there so TypeScript doesn't complain in the for loop
            var foo: any = "0";
            var view = new View();

            for (var p in foo) {
                assert.strictEqual(typeof view._getPropTarget(foo[p]), "object");
            }
        });

        it ('should return the root view model', function() {
            var rootView = new View();
            var childView = <View>rootView.addChild(new View());

            rootView.setData({
                foo: 'bar'
            });

            var propTarget = childView._getPropTarget('$root.foo');

            assert.strictEqual(propTarget.target, rootView.viewModel);
            assert.strictEqual(propTarget.viewModel, rootView.viewModel);
            assert.strictEqual(propTarget.propertyName, 'foo');
        });
    });

});
