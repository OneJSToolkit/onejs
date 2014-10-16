/// <reference path="../definitions/definitions.d.ts" />

import chai = require("chai");
import View = require("../src/View");
import Block = require("../src/Block");

var assert = chai.assert;

describe('View', function () {

    describe('Blocks Integration', function () {
        it('should render simple elements', function () {
            var view = new View();
            view._spec = {
                type: Block.BlockType.Element,
                tag: "div",
                children: [{type: Block.BlockType.Text, value: "Hello!"}]
            };

            var root = view.render();
            view.activate();

            assert.strictEqual(view.element, root);
            assert.strictEqual(root.textContent, 'Hello!');
            view.dispose();
        });

        it('should render bound elements', function () {
        });

        it('should react to VM updates', function () {
        });
    });

});