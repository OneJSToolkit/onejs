/// <reference path="../typings/tsd.d.ts" />

import chai = require('chai');
import List = require('../src/List');
import EventGroup = require('../src/EventGroup');
import ViewModel = require('../src/ViewModel');

var assert = chai.assert;

describe('List', function() {

    describe('constructor()', function() {
        it('should set data from the constructor', function() {
            var data = [1, 2, 3];
            var list = new List<number>(data);
            assert.sameMembers(list.array, data);
        });

        it('should set its array to an empty array if no args are passed in', function() {
            var list = new List<any>();
            assert.sameMembers(list.array, []);
        });

        it('should instantiate an instance of EventGroup', function() {
            var list = new List<any>();
            assert.instanceOf(list.events, EventGroup);
        });

        it('should fire change events if array items are observable and change', function() {
            var array = [
                new ViewModel(),
                new ViewModel()
            ];
            var list = new List<any>(array);
            var events = new EventGroup({});
            var hasChanged = false;

            events.on(list, 'change', function() {
                hasChanged = true;
            });

            array[0].change();

            assert.isTrue(hasChanged);
        });
    });

    describe('clear()', function() {
        it('should set its array to be empty', function() {
            var list = new List<string>(['one', 'two', 'three']);
            list.clear();
            assert.sameMembers(list.array, []);
        });
    });

    describe('getCount()', function() {
        it('should return 0 for an empty list', function() {
            var list = new List<any>();
            assert.strictEqual(list.getCount(), 0);
        });

        it('should return the count of the array', function() {
            var arr = [192, 168, 0, 1];
            var list = new List<number>(arr);
            assert.strictEqual(list.getCount(), 4);
        });
    });

    describe('setCount()', function() {
        it('should set its count to the given non-negative number (int)', function() {
            var list = new List<any>();
            list.setCount(10)
            assert.strictEqual(list.getCount(), 10);
        });
    });

    describe('getAt()', function() {
        it('should return items that exist', function() {
            var list = new List<string>(['hello', 'world']);
            assert.strictEqual(list.getAt(0), 'hello');
            assert.strictEqual(list.getAt(1), 'world');
        });

        it('should return undefined for items that do not exist', function() {
            var list = new List<string>(['hello', 'world']);
            assert.isUndefined(list.getAt(2));
            assert.isUndefined(list.getAt(-1));
        });
    });

    describe('findBy()', function() {
        it('should return -1 for items that are not defined', function() {
            var list = new List<number>([1, 2, 3]);
            assert.strictEqual(list.findBy('test', 'test'), -1);
        });
    });

    describe('setAt()', function() {
        it('should set the item at the given index', function() {
            var list = new List<number>([1, 2]);
            assert.isUndefined(list.getAt(2));
            list.setAt(2, 3);
            assert.strictEqual(list.getAt(2), 3);
        });
    });

    describe('setRange()', function() {
        it('should set the range of items starting at the given index', function() {
            var list = new List<number>([1]);
            list.setRange(1, [2, 3]);
            assert.strictEqual(list.getAt(0), 1);
            assert.strictEqual(list.getAt(1), 2);
            assert.strictEqual(list.getAt(2), 3);
        });
    });

    describe('insertAt()', function() {
        it('should insert the item at the given index', function() {
            var list = new List<number>([1, 2, 3]);
            list.insertAt(2, 4);
            assert.strictEqual(list.getAt(0), 1);
            assert.strictEqual(list.getAt(1), 2);
            assert.strictEqual(list.getAt(2), 4);
            assert.strictEqual(list.getAt(3), 3);
        });
    });

    describe('push()', function() {
        it('should put the item at the end of the list', function() {
            var list = new List<number>([1, 2]);
            list.push(3);
            assert.strictEqual(list.getAt(0), 1);
            assert.strictEqual(list.getAt(1), 2);
            assert.strictEqual(list.getAt(2), 3);
        });
    });

    describe('pop()', function() {
        it('should remove and return the item at the end of the list', function() {
            var list = new List<number>([1, 2, 3]);
            assert.strictEqual(list.getCount(), 3);
            assert.strictEqual(list.pop(), 3);
            assert.strictEqual(list.getCount(), 2);
        });

        it('should return undefined for an empty list', function() {
            var list = new List<any>();
            assert.isUndefined(list.pop());
        });
    });

    describe('removeAt()', function() {
        it('should remove the item at the given index', function() {
            var list = new List<number>([1, 2, 3]);
            list.removeAt(1);
            assert.strictEqual(list.getAt(0), 1);
            assert.strictEqual(list.getAt(1), 3);
            assert.strictEqual(list.getCount(), 2);
        });

        it('should not remove any items if the index is out of bounds', function() {
            var list = new List<number>([1, 2, 3]);
            list.removeAt(3);
            assert.strictEqual(list.getAt(0), 1);
            assert.strictEqual(list.getAt(1), 2);
            assert.strictEqual(list.getAt(2), 3);
            assert.strictEqual(list.getCount(), 3);
        });
    });

    describe('remove()', function() {
        it('should remove the item by the given value', function() {
            var list = new List<number>([1, 2, 3]);
            list.remove(1);
            assert.strictEqual(list.getAt(0), 2);
            assert.strictEqual(list.getAt(1), 3);
            assert.strictEqual(list.getCount(), 2);
        });

        it('should not remove any items if the value does not exist', function() {
            var list = new List<number>([1, 2, 3]);
            list.remove(4);
            assert.strictEqual(list.getAt(0), 1);
            assert.strictEqual(list.getAt(1), 2);
            assert.strictEqual(list.getAt(2), 3);
            assert.strictEqual(list.getCount(), 3);
        });
    });

});
