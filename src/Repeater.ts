import View = require('View');
import List = require('List');


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
    currentList = new List();
    _endComment: string;
    _surfaceRoots = [];

    onRenderHtml(): string {
        return '<div id="' + this.id + '_0">' + this.renderItems() + '</div>';
    }

    onViewModelChanged(changeArgs) {
        // evaluate new set of items
        if (this._state === 2 && changeArgs) {
            var surfaceElement = this._subElements.surface;

            switch (changeArgs.type) {
                case 'reset':
                    this._subElements.surface.innerHTML = this.renderItems();
                    this._findRoots();
                    break;

                case 'insert':

                    var div = document.createElement('div');
                    var frag = document.createDocumentFragment();
                    var child = this._createChild(changeArgs.item, changeArgs.index);

                    div.innerHTML = child.renderHtml();
                    while (div.childNodes.length) {
                        frag.appendChild(div.firstChild);
                    }

                    var elementBefore = this._surfaceRoots[changeArgs.index];

                    this._surfaceRoots.splice(changeArgs.index, 0, frag.firstChild);

                    if (elementBefore) {
                        surfaceElement.insertBefore(frag, elementBefore);
                    } else {
                        surfaceElement.appendChild(frag);
                    }

                    child.activate();

                    break;

                case'remove':
                    var childRoot = this._surfaceRoots[changeArgs.index];
                    var nodeToRemove = (changeArgs.index === (this._surfaceRoots.length - 1)) ? surfaceElement.lastChild : this._surfaceRoots[changeArgs.index + 1].previousSibling;
                    var lastNodeRemoved;

                    do {
                        lastNodeRemoved = nodeToRemove;
                        nodeToRemove = nodeToRemove.previousSibling;
                        surfaceElement.removeChild(lastNodeRemoved);
                    } while (lastNodeRemoved != childRoot);

                    this._surfaceRoots.splice(changeArgs.index, 1);
                    break;
            }
        }
    }

    onActivate() {
        this._findRoots();
    }

    renderItems() {
        var items = this.getValue(this.collectionName);
        var childHtml = '';


        if (!items.isList) {
            items = new List(items);
        }

        this.clearChildren();
        this._surfaceRoots = [];

        for (var i = 0; items && i < items.getCount(); i++) {
            childHtml += this._createChild(items.getAt(i), i).renderHtml() + '<!--' + this.id + '-->';
        }

        return childHtml;
    }

    _findRoots() {
        var childElements = this._subElements.surface.childNodes;
        var i;
        var childIndex = 0;

        for (i = 0; i < childElements.length; i++) {
            this._surfaceRoots[childIndex++] = childElements[i];

            while (i < childElements.length && childElements[i].textContent != this.id) {
                i++;
            }
        }
    }

    _createChild(item, index) {
            var newChild = this.addChild(new this.childViewType(), this.owner);
            var childData;

            childData = {};
            // childData[this.collectionName] = items;
            childData[this.itemName] = item;
            childData[this.indexName] = index;

            newChild.setData(childData);

            return newChild;
    }

    _bindings = [
        {
            "id": "0",
            "childId": "surface"
        }
    ];
}

export = Repeater;