import EventGroup = require('./EventGroup');
import List = require('./List');

class Selection {
    selectedKey = null;

    _selectedItems = {};
    _selectedCount = 0;

    isMultiSelectEnabled = true;

    _isAllSelected = false;
    _events: EventGroup = new EventGroup(this);
    _list: List;

    constructor(isMultiSelectEnabled?: boolean) {
        this._events.declare('change');

        this.isMultiSelectEnabled = isMultiSelectEnabled;
    }

    clear() {
        this._selectedItems = {};
        this._selectedCount = 0;
    }


    getSelectedKeys() {
        var selected = [];

        for (var key in this._selectedItems) {
            selected.push(this._selectedItems[key]);
        }

        return selected;
    }

    toggle(key) {
        this.setSelected(key, !this.isSelected(key));
    }

    toggleAllSelected() {
        if (this._selectedCount == 0) {
            this._isAllSelected = !this._isAllSelected;
        }
        else {
            this._isAllSelected = true;
        }

        this.clear();
        this.change();
    }

    setSelected(key, isSelected?: boolean) {

        isSelected = (isSelected === false) ? false : true;

        if (!key) {
            throw "Items used with Selection must have keys.";
        }

        if (!this.isMultiSelectEnabled) {
            this.clear();
        }

        if ((this._isAllSelected && !isSelected) || (!this._isAllSelected && isSelected)) {
            if (!this._selectedItems[key]) {
                this.selectedKey = this._selectedItems[key] = key;
                this._selectedCount++;
            }
        }
        else {
            if (this._selectedItems[key]) {
                delete this._selectedItems[key];
                this._selectedCount--;
            }
        }

        this.change();
    }

    isAllSelected() {
        return !!(this._isAllSelected && (this._selectedCount == 0));
    }

    isSelected(key) {
        return !!((this._isAllSelected && !this._selectedItems[key]) || (!this._isAllSelected && this._selectedItems[key]));
    }

    change() {
        this._events.raise('change');
    }
}

export = Selection;
