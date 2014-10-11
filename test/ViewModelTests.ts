/// <reference path="../definitions/definitions.d.ts" />

import chai = require('chai');
import ViewModel = require('../src/ViewModel');
import EventGroup = require('../src/EventGroup');

var assert = chai.assert;

describe('ViewModel', function () {
    
    describe('constructor()', function () {
        it('should set data', function () {
            var vm = new ViewModel({ a: 42 });
            assert.strictEqual(vm['a'], 42);
        });
    });

    describe('initialize()', function() {
    	it('should find values', function() {
    		var vm = new ViewModel();
    		var expectedFoo = 'hi';
    		var events = new EventGroup({});
    	
    		vm.parentValues = ['foo'];

    		events.on(vm, 'findValue', function(args) { 
    			args.val = expectedFoo; 
    			return false;
    			});

    		vm.initialize();
    		
    		events.off();

    		assert.strictEqual(vm['foo'], expectedFoo);
    	});
    });


});