/// <reference path="../typings/tsd.d.ts" />

import chai = require("chai");
import Observable = require("../src/Observable");
import EventGroup = require("../src/EventGroup");

var assert = chai.assert;

describe('Observable', function() {

    describe('constructor()', function() {
        it('should take a value from the constructor', function() {
            var obs = new Observable('foo');
            assert.strictEqual(obs._val, 'foo');
        });

        it('should be undefined with no value', function() {
            var obs = new Observable();
            assert.isUndefined(obs._val);
        });

        it('should instantiate an instance of EventGroup', function() {
            var obs = new Observable();
            assert.instanceOf(obs._events, EventGroup);
        });
    });

    describe('getValue()', function() {
        it('should get a value passed in through the constructor', function() {
            var obs = new Observable('foo');
            assert.strictEqual(obs.getValue(), 'foo');
        });
    });

    describe('setValue()', function() {
        it('should set a value', function() {
            var obs = new Observable();

            obs.setValue('foo');
            assert.strictEqual(obs.getValue(), 'foo');

            obs.setValue('bar');
            assert.strictEqual(obs.getValue(), 'bar');
        });
    });

    describe('change event', function() {
        it('should fire when the value changes', function() {
            var obs = new Observable();
            var events = new EventGroup({});
            var wasChanged = false;

            events.on(obs, 'change', function() { wasChanged = true; });

            obs.setValue('foo');
            assert.isTrue(wasChanged, 'did not change when assigning value foo');

            wasChanged = false;
            obs.setValue('foo');
            assert.isFalse(wasChanged, 'changed when the value didn\'t change');

            obs.setValue('bar');
            assert.isTrue(wasChanged, 'did not change when assigning value bar');
        });
    });

});
