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
});