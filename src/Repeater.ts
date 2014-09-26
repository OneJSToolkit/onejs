import View = require('./View');
import List = require('./List');


/// <summary>
/// The Repeater view renders a given child view (provided by the overridable getChildControlType function) for
/// each item in an array. It keeps the DOM updated as the array changes. Each item in
/// the array needs to contain objects that each have a 'key' property.
// If there is no key on an item, a unique one will be created so that the item can be uniquely identified.
/// </summary>
class Repeater extends View {
    viewName = 'Repeater';
    collectionName = 'items';
    itemName = 'item';
    indexName = 'index';
    childViewType = View;
    baseClass = '';
    removeDelay = 0;

    _currentList = new List();

    onRender(): HTMLElement {
        this.element = this._ce('div', ['class', this.baseClass]);
        this._diffChildren();

        return this.element;
    }

    getChildElements(): HTMLElement[] {
        var items = this.getValue(this.collectionName);
        var childElements = [];

        if (!items || !items.isList) {
            items = new List(items);
        }

        this.clearChildren();

        for (var i = 0; items && i < items.getCount(); i++) {
            childElements.push(this._createChild(items.getAt(i), i).render());
        }

        return childElements;
    }

    onViewModelChanged(changeArgs) {
        // evaluate new set of items
        if (this._state === 2) {
            var surfaceElement = this.element;
            var changeType = changeArgs ? changeArgs.type : 'reset';

            switch (changeType) {
                case 'insert':
                    this._insertChild(changeArgs.item, changeArgs.index);
                    break;

                case 'remove':
                    this._removeChild(changeArgs.index);
                    break;

                default:
                    this._diffChildren();
                    break;
            }
        }
    }

    _diffChildren() {
        var newList: List = < List > this.getValue(this.collectionName);
        var currentList = this._currentList;
        var surfaceElement = this.element;
        var element;
        var control;

        if (newList && !newList.isList) {
            newList = new List( < any > newList);
        }

        var count = newList.getCount();

        for (var i = 0; newList && i < count; i++) {
            var newItem = newList.getAt(i);
            var currentItem = currentList.getAt(i);

            var newKey = newItem ? (newItem.key = newItem.key || i) : null;
            var currentKey = currentItem ? (currentItem.key = currentItem.key || i) : null;

            if (newItem && !currentItem) {
                this._insertChild(newItem, i);
            } else if (newKey !== currentKey) {
                if (currentList.findBy('key', newKey) == -1) {
                    this._insertChild(newItem, i);
                } else {
                    this._removeChild(i--);
                }
            } else {
                this._updateChildData(this.children[i], newItem, i);
            }
        }

        while (currentList.getCount() > newList.getCount()) {
            this._removeChild(i);
        }

        //this._currentList = newList;
    }

    _insertChild(item, i) {
        var currentControl = this.children[i];
        var control = this._createChild(item, i);
        var element = control.render();

        this._updateChildData(control, item, i);

        if (currentControl) {
            this.element.insertBefore(element, currentControl.element);
        } else {
            this.element.appendChild(element);
        }

        if (this._state === 2) {
            control.activate();
        }
    }

    _removeChild(i) {
        var _this = this;
        var control = _this.children[i];
        var element = control.element;
        var timeToRemove = 0;

        // Delay dom cleanup if indicated by callback.
        if (control['onRepeaterRemove']) {
            timeToRemove = control['onRepeaterRemove'](i);
        }

        _this.removeChild(control);
        _this._currentList.removeAt(i);

        if (timeToRemove) {
            setTimeout(_removeDOM, timeToRemove);
        } else {
            _removeDOM();
        }

        function _removeDOM() {
            control.dispose();
            if (_this.element) {
                _this.element.removeChild(element);
            }
        }
    }


    _createChild(item, index) {
        var newChild = this.addChild(new this.childViewType(), this.owner, index);

        this._updateChildData(newChild, item, index);
        this._currentList.insertAt(index, item);

        return newChild;
    }

    _updateChildData(control, item, index) {
        var childData;

        childData = {};
        // childData[this.collectionName] = currentList;
        childData[this.itemName] = item;
        childData[this.indexName] = index;

        control.setData(childData);
    }

    _bindings = [{
        "id": "0",
        "childId": "surface"
    }];
}

export = Repeater;