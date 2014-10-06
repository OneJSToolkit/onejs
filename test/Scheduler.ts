/// <reference path="../definitions/definitions.d.ts" />

import chai = require("chai");
import rewire = require("rewire");
import _Scheduler = require('../src/Scheduler');
var Scheduler = rewire<typeof _Scheduler>('../src/Scheduler');

var assert = chai.assert;

describe('Scheduler', function () {

    describe('#main', function () {
        it('should schedule tasks', function (done) {
            Scheduler.main.schedule(done);
        });

        it('should execute tasks in order', function (done) {
            var count = 0;
            Scheduler.main.schedule(function () {
                assert.strictEqual(count, 0);
                count++;
            });
            Scheduler.main.schedule(function () {
                assert.strictEqual(count, 1);
                done();
            });
        });

        it('should execute tasks inserted at the top first', function (done) {
            var count = 0;
            Scheduler.main.schedule(function () {
                assert.strictEqual(count, 1);
                done();
            });
            Scheduler.main.schedule(function () {
                assert.strictEqual(count, 0);
                count++;
            }, true);
        });

        it('should allow tasks to schedule tasks', function (done) {
            var count = 0;
            Scheduler.main.schedule(function () {
                assert.strictEqual(count, 0);
                count++;

                Scheduler.main.schedule(function () {
                    assert.strictEqual(count, 1);
                    done();
                });
            });
        });

        it('should handle tasks that throw an exception', function (done) {

            var calls = [];

            function fakeImmediate(func) {
                calls.push(func);
            }
            var revert = Scheduler['__set__']('_setImmediate', fakeImmediate);

            Scheduler.main.schedule(function () {
                throw Error("Oh no!");
            });

            Scheduler.main.schedule(function () {
                revert();
                done();
            });

            assert.strictEqual(calls.length, 1);
            assert.throws(calls[0], "Oh no!"); // execute the first task
            assert.strictEqual(calls.length, 2);
            assert.doesNotThrow(calls[1]); // execute the second task

        });

        it('should yield when time slice is exhausted', function (done) {

            var calls = [];

            function fakeImmediate(func) {
                calls.push(func);
            }

            var nowValue = 0;
            function fakeNow() {
                return nowValue;
            }


            var revert = [];
            revert.push(Scheduler['__set__']('_setImmediate', fakeImmediate));
            revert.push(Scheduler['__set__']('_now', fakeNow));
            var TIME_SLICE = Scheduler['__get__']('TIME_SLICE');

            Scheduler.main.schedule(function () {
                nowValue = TIME_SLICE + 1;
            });

            Scheduler.main.schedule(function () {
                revert.forEach(function (revertFunc) {
                    revertFunc();
                });
                done();
            });

            assert.strictEqual(calls.length, 1);
            assert.doesNotThrow(calls[0]); // execute the first task
            assert.strictEqual(calls.length, 2);
            assert.doesNotThrow(calls[1]); // execute the second task

        });

        it('should not yield when time slice is not exhausted', function (done) {

            var calls = [];

            function fakeImmediate(func) {
                calls.push(func);
            }

            var nowValue = 0;
            function fakeNow() {
                return nowValue;
            }


            var revert = [];
            revert.push(Scheduler['__set__']('_setImmediate', fakeImmediate));
            revert.push(Scheduler['__set__']('_now', fakeNow));
            var TIME_SLICE = Scheduler['__get__']('TIME_SLICE');

            var count = 0;
            Scheduler.main.schedule(function () {
                count++;
            });

            Scheduler.main.schedule(function () {
                count++;
            });

            assert.strictEqual(calls.length, 1);
            assert.doesNotThrow(calls[0]); // execute the first task
            assert.strictEqual(calls.length, 1);
            assert.strictEqual(count, 2);
            revert.forEach(function (revertFunc) {
                revertFunc();
            });
            done();


        });
    });

    describe('#before', function () {
        it('should execute before tasks first', function (done) {
            var count = 0;

            Scheduler.main.before.schedule(function () {
                assert.strictEqual(count, 0);
                count++;
            });

            Scheduler.main.schedule(function () {
                assert.strictEqual(count, 1);
                done();
            });
        });

        it('should have an after that is distinct from main', function () {
            assert.notStrictEqual(Scheduler.main.before.after, Scheduler.main);
        });

    });

    describe('#after', function () {
        it('should execute after tasks second', function (done) {
            var count = 0;

            Scheduler.main.schedule(function () {
                assert.strictEqual(count, 0);
                count++;
            });

            Scheduler.main.after.schedule(function () {
                assert.strictEqual(count, 1);
                done();
            });
        });

        it('should have a before that is distinct from main', function () {
            assert.notStrictEqual(Scheduler.main.after.before, Scheduler.main);
        });
    });

    describe('#cancel', function () {
        it('should not execute a cancelled task', function (done) {

            var id = Scheduler.main.schedule(function () {
                assert.fail();
            });

            Scheduler.cancel(id);

            Scheduler.main.schedule(function () {
                done();
            });

        });
    });
});