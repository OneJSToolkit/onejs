var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", 'View'], function(require, exports, View) {
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
            this._bindings = [
                {
                    "id": "0",
                    "childId": "surface"
                }
            ];
        }
        Repeater.prototype.onRenderHtml = function () {
            return '<div id="' + this.id + '_0">' + this.renderItems() + '</div>';
        };

        Repeater.prototype.renderItems = function () {
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
        };
        return Repeater;
    })(View);

    
    return Repeater;
});
