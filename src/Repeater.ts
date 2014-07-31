import View = require('View');

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

    onRenderHtml(): string {
        return '<div id="' + this.id + '_0">' + this.renderItems() + '</div>';
    }

    renderItems() {
        var items = this.getValue(this.collectionName);
        var childHtml = '';

        this.clearChildren();

        for (var i = 0; items && i < items.length; i++) {
            var newChild = this.addChild(new this.childViewType(), this.owner);
            var childData;

            childData = {};
            childData[this.collectionName] = items;
            childData[this.itemName] = items[i];
            childData[this.indexName] = i;

            newChild.setData(childData);

            childHtml += newChild.renderHtml();
        }

        return childHtml;
    }

    _bindings = [
        {
            "id": "0",
            "childId": "surface"
        }
    ];
}

export = Repeater;