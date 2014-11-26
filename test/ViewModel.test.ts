/// <reference path="../typings/tsd.d.ts" />

import chai = require("chai");
import ViewModel = require("../src/ViewModel");
import View = require("../src/View");

var assert = chai.assert;

describe('ViewModel', function () {

    describe('constructor()', function () {
        it('should set data from the constructor', function () {
            var vm = new ViewModel({ a: 42 });
            assert.strictEqual(vm['a'], 42);
        });
    });

    describe('findValue()', function() {
        it ('should find a value from root', function() {
            var rootView = new View();
            var childView = <View>rootView.addChild(new View());
            var grandChildView = childView.addChild(new View());

            rootView.setData({
                foo: { bar: 'baz' }
            });

            childView.setData({
                foo: { baz: 'boz' }
            });

            rootView.activate();

            assert.strictEqual(grandChildView.viewModel.findValue('foo.bar'), 'baz');
        });
    });

    describe('setData()', function() {
        it('should set data', function() {
            var vm = new ViewModel();
            assert.strictEqual(vm['foo'], undefined);
            vm.setData({foo: 'hello world'});
            assert.strictEqual(vm['foo'], 'hello world');
        });

        it('should not set data from the prototype', function() {
            var vm = new ViewModel();

            var ParentClass = function() {
                this.foo = 42;
            };

            var SubClass = function() {
                this.bar = 'hello';
            };

            SubClass.prototype = new ParentClass();

            vm.setData(new SubClass());
            assert.strictEqual(vm['foo'], undefined);
        });
    });

});
