var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'View', 'List'], function(require, exports, View, List) {
    /// <summary>
    /// The Repeater view renders a given child view (provided by the overridable getChildControlType function) for
    /// each item in an array. It keeps the DOM updated as the array changes. Each item in
    /// the array needs to contain objects that each have a 'key' property.
    // If there is no key on an item, a unique one will be created so that the item can be uniquely identified.
    /// </summary>
    var Repeater = (function (_super) {
        __extends(Repeater, _super);
        function Repeater() {
            _super.apply(this, arguments);
            this.viewName = 'Repeater';
            this.collectionName = 'items';
            this.itemName = 'item';
            this.indexName = 'index';
            this.childViewType = View;
            this.baseClass = '';
            this._currentList = new List();
            this._surfaceRoots = [];
            this._bindings = [
                {
                    "id": "0",
                    "childId": "surface"
                }
            ];
        }
        Repeater.prototype.onRenderElement = function () {
            return (this.element = this._ce('div', ['class', this.baseClass], null, this.getChildElements()));
        };

        Repeater.prototype.getChildElements = function () {
            var items = this.getValue(this.collectionName);
            var childElements = [];

            if (!items || !items.isList) {
                items = new List(items);
            }

            this.clearChildren();

            for (var i = 0; items && i < items.getCount(); i++) {
                childElements.push(this._createChild(items.getAt(i), i).renderElement());
            }

            return childElements;
        };

        Repeater.prototype.onViewModelChanged = function (changeArgs) {
            // evaluate new set of items
            if (this._state === 2) {
                var surfaceElement = this.element;
                var changeType = changeArgs ? changeArgs.type : 'reset';

                switch (changeType) {
                    case 'insert':
                        var div = document.createElement('div');
                        var frag = document.createDocumentFragment();
                        var child = this._createChild(changeArgs.item, changeArgs.index);
                        var elementAtPosition = surfaceElement.childNodes[changeArgs.index];
                        var childElement = child.renderElement();

                        if (elementAtPosition) {
                            surfaceElement.insertBefore(childElement, elementAtPosition);
                        } else {
                            surfaceElement.appendChild(childElement);
                        }

                        child.activate();
                        break;

                    case 'remove':
                        var element = surfaceElement.childNodes[changeArgs.index];
                        var control = element['control'];

                        control.dispose();
                        this.removeChild(control);
                        surfaceElement.removeChild(element);

                        break;

                    default:
                        this._diffChildren();
                        break;
                }
            }
        };

        Repeater.prototype._diffChildren = function () {
            var newList = this.getValue(this.collectionName);
            var currentList = this._currentList;
            var surfaceElement = this.element;
            var element;
            var control;

            if (currentList && !currentList.isList) {
                currentList = new List(currentList);
            }

            var count = newList.getCount();

            for (var i = 0; newList && i < count; i++) {
                var newItem = newList.getAt(i);
                var currentItem = currentList.getAt(i);

                if (newItem && !currentItem) {
                    this._insertChild(newItem, i);
                } else if (newItem.key !== currentItem.key) {
                    if (currentList.findBy('key', newItem.key) == -1) {
                        this._insertChild(newItem, i);
                    } else {
                        this._removeChild(i--);
                    }
                }
                while (currentList.getCount() > newList.getCount()) {
                    this._removeChild(i);
                }
            }

            this._currentList = newList;
        };

        Repeater.prototype._insertChild = function (item, i) {
            var control = this._createChild(item, i);
            var element = this.element.childNodes[i];

            this._updateChildData(control, item, i);

            if (element) {
                this.element.insertBefore(control.renderElement(), element);
            } else {
                this.element.appendChild(control.renderElement());
            }

            if (this._state === 2) {
                control.activate();
            }
        };

        Repeater.prototype._removeChild = function (i) {
            var element = this.element.childNodes[i];
            var control = element['control'];

            control.dispose();
            this.removeChild(control);
            this.element.removeChild(element);
        };

        Repeater.prototype._createChild = function (item, index) {
            var newChild = this.addChild(new this.childViewType(), this.owner);

            this._updateChildData(newChild, item, index);

            return newChild;
        };

        Repeater.prototype._updateChildData = function (control, item, index) {
            var childData;

            childData = {};

            // childData[this.collectionName] = currentList;
            childData[this.itemName] = item;
            childData[this.indexName] = index;

            control.setData(childData);
        };
        return Repeater;
    })(View);

    
    return Repeater;
});
