var EventGroup = require('EventGroup');

var Selection = (function () {
    function Selection() {
        this.selectedItem = null;
        this._selectedItems = {};
        this._singleSelect = true;
        this._events = new EventGroup(this);
        this._events.declare('change');
    }
    Selection.prototype.clear = function () {
        this._selectedItems = {};
    };

    Selection.prototype.getSelectedItems = function () {
        var selected = [];

        for (var key in this._selectedItems) {
            selected.push(this._selectedItems[key]);
        }

        return selected;
    };

    Selection.prototype.setSelected = function (item, isSelected) {
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
        } else {
            delete this._selectedItems[key];
        }

        this._events.raise('change');
    };

    Selection.prototype.isSelected = function (item) {
        return !!this._selectedItems[item.key];
    };
    return Selection;
})();

module.exports = Selection;
