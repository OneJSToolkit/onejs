import EventGroup = require('./EventGroup');

var CHANGE_EVENT ='change';
var CHILD_CHANGE_EVENT ='change';

class List {
    isList = true;

    array: any[];
    events = new EventGroup(this);

    constructor(array?: any[]) {
        this.array = array || [];
        this.events.declare([ CHANGE_EVENT, CHILD_CHANGE_EVENT ]);
    }

    clear() {
        this.array = [];
        this.events.off();
    }

    getCount() {
        return this.array.length;
    }

    setCount(count: number) {
        this.array.length = count;
    }

    indexOf(item) {
        return this.array.indexOf(item);
    }
    
    findBy(propertyName, propertyValue) {
        for (var i = 0; i < this.array.length; i++) {
            var item = this.getAt(i);

            if (item && item[propertyName] == propertyValue) {
                return i;
            }
        }

        return -1;
    }

    getAt(index) {
        return this.array[index];
    }

    setAt(index, item, suppressChange?: boolean) {

        if (this.array[index]) {
            this.events.off(this.array[index]);
        }

        this.array[index] = item;

        if (item && EventGroup.isDeclared(item, CHANGE_EVENT)) {
            this.events.on(item, CHANGE_EVENT, this.childChange);
        }

        if (!suppressChange) {
            this.change({ type: 'update', index: index, item: item });
        }
    }

    setRange(index, items) {
        for (var i = 0; i < items.length; i++) {
            this.setAt(index++, items[i], true);
        }
        this.change({ type: 'insertRange', index: index, items: items });
    }

    insertAt(index, item) {
        this.array.splice(index, 0, item);

        if (item && EventGroup.isDeclared(item, CHANGE_EVENT)) {
            this.events.on(item, CHANGE_EVENT, this.childChange);
        }
        this.change({ type: 'insert', index: index, item: item });
    }

    push(item) {
        this.setAt(this.array.length, item, true);

        this.change({ type: 'insert', index: this.array.length - 1, item: item });

        return item;
    }

    pop() {
        var item = this.array.pop();

        this.change({ type: 'remove', index: this.array.length });

        return item;
    }

    remove(item) {
        this.removeAt(this.array.indexOf(item));
    }

    removeAt(index) {
        if (index >= 0 && index < this.array.length) {
            var item = this.array[index];

            if (item) {
                this.events.off(this.array[index]);
            }

            this.array.splice(index, 1);
            this.change({ type: 'remove', index: index });
        }
    }

    change(details) {
        this.events.raise(CHANGE_EVENT, details);
    }

    childChange() {
        this.events.raise(CHILD_CHANGE_EVENT);
    }
}

export = List;
