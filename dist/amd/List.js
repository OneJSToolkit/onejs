define(["require", "exports", 'EventGroup'], function(require, exports, EventGroup) {
    var CHANGE_EVENT = 'change';
    var CHILD_CHANGE_EVENT = 'change';

    var List = (function () {
        function List(array) {
            this.isList = true;
            this.events = new EventGroup(this);
            this.array = array || [];
            this.events.declare([CHANGE_EVENT, CHILD_CHANGE_EVENT]);
        }
        List.prototype.clear = function () {
            this.array = [];
            this.events.off();
        };

        List.prototype.getCount = function () {
            return this.array.length;
        };

        List.prototype.setCount = function (count) {
            this.array.length = count;
        };

        List.prototype.indexOf = function (item) {
            return this.array.indexOf(item);
        };

        List.prototype.getAt = function (index) {
            return this.array[index];
        };

        List.prototype.setAt = function (index, item) {
            if (this.array[index]) {
                this.events.off(this.array[index]);
            }

            this.array[index] = item;

            if (item && EventGroup.isDeclared(item, CHANGE_EVENT)) {
                this.events.on(item, CHANGE_EVENT, this.childChange);
            }

            this.change({ type: 'update', index: index, item: item });
        };

        List.prototype.setRange = function (index, items) {
            for (var i = 0; i < items.length; i++) {
                this.setAt(index++, items[i]);
            }
            this.change({ type: 'insertRange', index: index, items: items });
        };

        List.prototype.insertAt = function (index, item) {
            this.array.splice(index, 0, item);

            if (item && EventGroup.isDeclared(item, CHANGE_EVENT)) {
                this.events.on(item, CHANGE_EVENT, this.childChange);
            }
            this.change({ type: 'insert', index: index, item: item });
        };

        List.prototype.push = function (item) {
            this.setAt(this.array.length, item);

            this.change({ type: 'insert', index: this.array.length - 1, item: item });

            return item;
        };

        List.prototype.pop = function () {
            var item = this.array.pop();

            this.change({ type: 'remove', index: this.array.length });

            return item;
        };

        List.prototype.remove = function (item) {
            this.removeAt(this.array.indexOf(item));
        };

        List.prototype.removeAt = function (index) {
            if (index >= 0 && index < this.array.length) {
                var item = this.array[index];

                if (item) {
                    this.events.off(this.array[index]);
                }

                this.array.splice(index, 1);
                this.change({ type: 'remove', index: index });
            }
        };

        List.prototype.change = function (details) {
            this.events.raise(CHANGE_EVENT, details);
        };

        List.prototype.childChange = function () {
            this.events.raise(CHILD_CHANGE_EVENT);
        };
        return List;
    })();

    
    return List;
});
