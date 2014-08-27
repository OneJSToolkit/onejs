import EventGroup = require('EventGroup');

class Selection {
    selectedItem = null;

    _selectedItems = {};

    _singleSelect = true;

    _events: EventGroup = new EventGroup(this);

    constructor() {
        this._events.declare('change');
    }

    clear() {
        this._selectedItems = {};
    }


    getSelectedItems() {
        var selected = [];

        for (var key in this._selectedItems) {
            selected.push(this._selectedItems[key]);
        }

        return selected;
    }

    setSelected(item, isSelected?: boolean) {
        var key = item.key;

        isSelected = (isSelected === false) ? false : true;

        if (!key) {
            throw "Items used with Selection must have keys.";
        }

        if (this._singleSelect) {
            this.clear();
        }

        if (isSelected) {
            this.selectedItem = this._selectedItems[key] = item;
        }
        else {
            delete this._selectedItems[key];
        }

        this._events.raise('change');
    }

    isSelected(item) {
        return !!this._selectedItems[item.key];
    }
}

export = Selection;
