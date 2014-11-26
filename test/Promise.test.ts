/// <reference path="../../typings/tsd.d.ts" />

import chai = require("chai");
import Promise = require("../src/Promise");

var expect = chai.expect;
var assert = chai.assert;

describe('Promise', function() {

    describe('cancel()', function() {

        it('cancels a promise chain', function(done) {
            var executedFirst = false;
            var executedSecond = false;

            var p = new Promise(function(complete, error) {
                setTimeout(function() {
                    console.log('Completed original promise execution.');
                    complete();
                }, 500);
            });

            p.then(function() {
                executedFirst = true;
                console.log('Finishing first then callback.');
            })
            .wait(500)
            .then(function() {
                console.log('Finishing second then. This should not hit.')
                executedSecond = true;
            });

            setTimeout(function() {
                console.log('Canceling promise.')
                p.cancel();
            }, 750);

            setTimeout(function() {
                console.log('Evaluating promise then calls.')
                expect(executedFirst).to.equal(true);
                expect(executedSecond).to.equal(false);
                done();
            }, 1100);
        });
    });
});
