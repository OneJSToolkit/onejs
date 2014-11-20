define(["require", "exports", './EventGroup'], function(require, exports, EventGroup) {
    var Selection = (function () {
        function Selection(isMultiSelectEnabled) {
            this.selectedKey = null;
            this._selectedItems = {};
            this._selectedCount = 0;
            this.isMultiSelectEnabled = true;
            this._isAllSelected = false;
            this._events = new EventGroup(this);
            this._events.declare('change');

            this.isMultiSelectEnabled = isMultiSelectEnabled;
        }
        Selection.prototype.setList = function (list) {
            if (this._list) {
                this._events.off(this._list);
            }

            this._list = list;

            if (this._list) {
                this._events.on(this._list, 'change', this._onListChanged);
            }
        };

        Selection.prototype.clear = function (suppressChange) {
            this._selectedItems = {};
            this._selectedCount = 0;
            this._isAllSelected = false;

            if (!suppressChange) {
                this.change();
            }
        };

        Selection.prototype.getCount = function () {
            var count = 0;

            if (this._list) {
                if (this._isAllSelected) {
                    count = this._list.getCount() - this._selectedCount;
                } else {
                    count = this._selectedCount;
                }
            }

            return count;
        };

        Selection.prototype.getSelectedKeys = function () {
            var selected = [];

            for (var key in this._selectedItems) {
                selected.push(this._selectedItems[key]);
            }

            return selected;
        };

        Selection.prototype.toggle = function (key) {
            this.setSelected(key, !this.isSelected(key));

            return false;
        };

        Selection.prototype.toggleAllSelected = function () {
            if (this._selectedCount == 0) {
                this._isAllSelected = !this._isAllSelected;
            } else {
                this._isAllSelected = true;
                this._selectedItems = {};
                this._selectedCount = 0;
            }

            this.change();

            return false;
        };

        Selection.prototype.setSelected = function (key, isSelected) {
            isSelected = (isSelected === false) ? false : true;

            if (!key) {
                throw "Items used with Selection must have keys.";
            }

            if (!this.isMultiSelectEnabled) {
                this.clear(true);
            }

            if ((this._isAllSelected && !isSelected) || (!this._isAllSelected && isSelected)) {
                if (!this._selectedItems[key]) {
                    this.selectedKey = this._selectedItems[key] = key;
                    this._selectedCount++;
                }
            } else {
                if (this._selectedItems[key]) {
                    delete this._selectedItems[key];
                    this._selectedCount--;
                }
            }

            this.change();
        };

        Selection.prototype.isAllSelected = function () {
            return !!(this._isAllSelected && (this._selectedCount == 0));
        };

        Selection.prototype.isSelected = function (key) {
            return !!((this._isAllSelected && !this._selectedItems[key]) || (!this._isAllSelected && this._selectedItems[key]));
        };

        Selection.prototype.change = function () {
            this._events.raise('change');
        };

        Selection.prototype._onListChanged = function (ev) {
        };

        Selection.prototype._evaluateSelection = function () {
        };
        return Selection;
    })();

    
    return Selection;
});
