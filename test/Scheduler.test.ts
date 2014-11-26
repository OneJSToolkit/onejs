/// <reference path="../typings/tsd.d.ts" />

import chai = require("chai");
import Scheduler = require('../Scheduler');

var assert = chai.assert;

describe('Scheduler', function () {
    var scheduler: Scheduler.IQueue;
    var backend: Scheduler._SchedulerBackend;

    beforeEach(function() {
        backend = new Scheduler._SchedulerBackend();
        scheduler = backend.buildMain();
    });

    describe('#main', function () {
        it('should schedule tasks', function (done) {
            scheduler.schedule(done);
        });

        it('should execute tasks in order', function (done) {
            var count = 0;
            scheduler.schedule(function () {
                assert.strictEqual(count, 0);
                count++;
            });
            scheduler.schedule(function () {
                assert.strictEqual(count, 1);
                done();
            });
        });

        it('should execute tasks inserted at the top first', function (done) {
            var count = 0;
            scheduler.schedule(function () {
                assert.strictEqual(count, 1);
                done();
            });
            scheduler.schedule(function () {
                assert.strictEqual(count, 0);
                count++;
            }, true);
        });

        it('should allow tasks to schedule tasks', function (done) {
            var count = 0;
            scheduler.schedule(function () {
                assert.strictEqual(count, 0);
                count++;

                scheduler.schedule(function () {
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
            backend._setImmediate = fakeImmediate;

            console.log("Scheduled first");
            scheduler.schedule(function () {
                console.log("First evaluated");
                throw Error("Oh no!");
            });

            scheduler.schedule(function () {
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

            backend._setImmediate = fakeImmediate;
            backend._now = fakeNow;

            scheduler.schedule(function () {
                nowValue = backend.time_slice + 1;
            });

            scheduler.schedule(function () {
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

            backend._setImmediate = fakeImmediate;
            backend._now = fakeNow;

            var count = 0;
            scheduler.schedule(function () {
                count++;
            });

            scheduler.schedule(function () {
                count++;
            });

            assert.strictEqual(calls.length, 1);
            assert.doesNotThrow(calls[0]); // execute the first task
            assert.strictEqual(calls.length, 1);
            assert.strictEqual(count, 2);

            done();
        });
    });

    describe('#before', function () {
        it('should execute before tasks first', function (done) {
            var count = 0;

            scheduler.before.schedule(function () {
                assert.strictEqual(count, 0);
                count++;
            });

            scheduler.schedule(function () {
                assert.strictEqual(count, 1);
                done();
            });
        });

        it('should have an after that is distinct from main', function () {
            assert.notStrictEqual(scheduler.before.after, scheduler);
        });

    });

    describe('#after', function () {
        it('should execute after tasks second', function (done) {
            var count = 0;

            scheduler.schedule(function () {
                assert.strictEqual(count, 0);
                count++;
            });

            scheduler.after.schedule(function () {
                assert.strictEqual(count, 1);
                done();
            });
        });

        it('should have a before that is distinct from main', function () {
            assert.notStrictEqual(scheduler.after.before, scheduler);
        });
    });

    describe('#cancel', function () {
        it('should not execute a cancelled task', function (done) {

            var id = scheduler.schedule(function () {
                assert.fail();
            });

            Scheduler.cancel(id);

            scheduler.schedule(function () {
                done();
            });

        });
    });

    describe('#retrieveState', function () {

        it('should report empty when no tasks are scheduled', function () {
            var state = Scheduler.retrieveState(backend);
            assert.strictEqual(state.tasks.length, 0);
        });

        it('should show scheduled tasks', function (done) {
            scheduler.schedule(done, false, "xyzzy");
            var state = Scheduler.retrieveState(backend);
            assert.strictEqual(state.tasks.length, 1);
            var task = state.tasks[0];
            assert.strictEqual(task.name, "xyzzy");
        });

        it('should provide accurate ids for cancellation', function (done) {
            scheduler.schedule(function () {
                assert.fail();
            });
            var state = Scheduler.retrieveState(backend);
            assert.strictEqual(state.tasks.length, 1);
            var task = state.tasks[0];
            Scheduler.cancel(task.id);
            assert.strictEqual(task.cancelled, false);

            state = Scheduler.retrieveState(backend);
            assert.strictEqual(state.tasks.length, 1);
            task = state.tasks[0];
            assert.strictEqual(task.cancelled, true);

            scheduler.schedule(done);
        });

        it('should show the active task', function (done) {
            var id = scheduler.schedule(function () {
                var state = Scheduler.retrieveState(backend);
                assert.strictEqual(state.activeTask.id, id);
                assert.strictEqual(state.activeTask.name, "activeTask");
                assert.strictEqual(state.tasks.length, 0);
                done();
            }, false, "activeTask");
        });

        it('should show multiple queues in order', function (done) {
            var count = 0;

            scheduler.after.schedule(function () {
                assert.strictEqual(count, 2);
                done();
            }, false, "third");

            scheduler.schedule(function () {
                assert.strictEqual(count, 1);
                count++;
            }, false, "second");

            scheduler.before.schedule(function () {
                assert.strictEqual(count, 0);
                count++;
            }, false, "first");

            var state = Scheduler.retrieveState(backend);
            assert.strictEqual(state.tasks.length, 3);
            var taskNames = state.tasks.map(function (task) {
                return task.name;
            });
            assert.deepEqual(taskNames, ["first", "second", "third"]);
        });

    });

    describe('#activeQueue', function () {
        it('should reflect the queue of the current task', function (done) {
            var beforeQueue = Scheduler.main.before;

            beforeQueue.schedule(function () {
                assert.strictEqual(Scheduler.activeQueue, beforeQueue);
                done();
            });
        });
    });
});
