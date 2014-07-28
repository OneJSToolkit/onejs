import View = require('View');

/// <summary>
/// The Repeater view renders a given child view (provided by the overridable getChildControlType function) for
/// each item in an array. It keeps the DOM updated as the array changes. Each item in
/// the array needs to contain objects that each have a 'key' property.
// If there is no key on an item, a unique one will be created so that the item can be uniquely identified.
/// </summary>
class Repeater extends View {
    viewName = 'Repeater';
    childViewType = View;
    collectionName = 'items';

    onRenderHtml(): string {
        return '<div id="' + this.id + '_0">' + this.renderItems() + '</div>';
    }

    getViewModel(): any {
        return this.parent.getViewModel();
    }

    renderItems() {
        var items = this.getValue(this.collectionName);
        var childHtml = '';

        this.clearChildren();

        for (var i = 0; items && i < items.length; i++) {
            var newChild = this.addChild(new this.childViewType());

            newChild.setData(items[i]);
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