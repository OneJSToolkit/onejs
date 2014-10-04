/// <reference path="../definitions/definitions.d.ts" />

import chai = require("chai");
import Scheduler = require('../src/Scheduler');

var assert = chai.assert;

describe('Scheduler', function () {

    describe('#main', function () {
        it('should schedule tasks', function (done) {
            Scheduler.main.schedule(done);
        });

        it('should execute tasks in order', function (done) {
            var count = 0;
            Scheduler.main.schedule(function () {
                assert.equal(count, 0);
                count++;
            });
            Scheduler.main.schedule(function () {
                assert.equal(count, 1);
                done();
            });
        });

        it('should execute tasks inserted at the top first', function (done) {
            var count = 0;
            Scheduler.main.schedule(function () {
                assert.equal(count, 1);
                done();
            });
            Scheduler.main.schedule(function () {
                assert.equal(count, 0);
                count++;
            }, true);
        });
    });
});