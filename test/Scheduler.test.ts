/// <reference path="../typings/tsd.d.ts" />

import chai = require("chai");
import rewire = require("rewire");
import _Scheduler = require('../Scheduler');
var Scheduler:typeof _Scheduler;

var assert = chai.assert;

describe('Scheduler', function () {

    beforeEach(function () {
       Scheduler = rewire<typeof _Scheduler>('../Scheduler');
    });

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

    describe('#retrieveState', function () {

        it('should report empty when no tasks are scheduled', function () {
            var state = Scheduler.retrieveState();
            assert.strictEqual(state.tasks.length, 0);
        });

        it('should show scheduled tasks', function (done) {
            Scheduler.main.schedule(done, false, "xyzzy");
            var state = Scheduler.retrieveState();
            assert.strictEqual(state.tasks.length, 1);
            var task = state.tasks[0];
            assert.strictEqual(task.name, "xyzzy");
        });

        it('should provide accurate ids for cancellation', function (done) {
            Scheduler.main.schedule(function () {
                assert.fail();
            });
            var state = Scheduler.retrieveState();
            assert.strictEqual(state.tasks.length, 1);
            var task = state.tasks[0];
            Scheduler.cancel(task.id);
            assert.strictEqual(task.cancelled, false);

            state = Scheduler.retrieveState();
            assert.strictEqual(state.tasks.length, 1);
            task = state.tasks[0];
            assert.strictEqual(task.cancelled, true);

            Scheduler.main.schedule(done);
        });

        it('should show the active task', function (done) {
            var id = Scheduler.main.schedule(function () {
                var state = Scheduler.retrieveState();
                assert.strictEqual(state.activeTask.id, id);
                assert.strictEqual(state.activeTask.name, "activeTask");
                assert.strictEqual(state.tasks.length, 0);
                done();
            }, false, "activeTask");
            
        });

        it('should show multiple queues in order', function (done) {

            var count = 0;

            Scheduler.main.after.schedule(function () {
                assert.strictEqual(count, 2);
                done();
            }, false, "third");

            Scheduler.main.schedule(function () {
                assert.strictEqual(count, 1);
                count++;
            }, false, "second");

            Scheduler.main.before.schedule(function () {
                assert.strictEqual(count, 0);
                count++;
            }, false, "first");

            var state = Scheduler.retrieveState();
            assert.strictEqual(state.tasks.length, 3);
            var taskNames = state.tasks.map(function (task) {
                return task.name;
            });
            assert.deepEqual(taskNames, ["first", "second", "third"]);

        });

    });

    describe('#activeQueue', function () {

        it('should default to the main queue', function () {
            assert.strictEqual(Scheduler.activeQueue, Scheduler.main);
        });

        it('should reflect the queue of the current task', function (done) {
            var beforeQueue = Scheduler.main.before;

            beforeQueue.schedule(function () {
                assert.strictEqual(Scheduler.activeQueue, beforeQueue);
                done();
            });
        });
    });
});