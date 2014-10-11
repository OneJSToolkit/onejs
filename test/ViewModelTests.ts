/// <reference path="../definitions/definitions.d.ts" />

import chai = require("chai");
import ViewModel = require("../src/ViewModel");

var assert = chai.assert;

describe('ViewModel', function () {

    describe('#initialize()', function () {
        it('should set data from the constructor', function () {
            var vm = new ViewModel({ a: 42 });
            assert.isUndefined(vm['a'], 'Assignment should be deferred until after initialization');
            vm.initialize();
            assert.strictEqual(vm['a'], 42);
        });
    });

    describe('#__getDataKeys()', function() {
        it('should get the data keys from the object', function() {
            var vm = new ViewModel();
            var dataKeys = vm.__getDataKeys(vm);
            assert.sameMembers(dataKeys, ['isViewModel', 'parentValues']);
        });

        it('should return an empty array for non-objects', function() {
            var vm = new ViewModel();
            var dataKeys = vm.__getDataKeys(123);
            assert.sameMembers([], []);
        });
    });
});