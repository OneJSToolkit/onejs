var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", './Block', './BlockProcessor', './List'], function(require, exports, Block, BlockProcessor, List) {
    var RepeaterBlock = (function (_super) {
        __extends(RepeaterBlock, _super);
        function RepeaterBlock(view, parent, source, iterator, blockTemplate) {
            _super.call(this, view, parent);
            this.bound = false;
            this.rendered = false;
            this._currentList = new List();
            this.source = source;
            this.iterator = iterator;
            this.blockTemplate = blockTemplate;
        }
        RepeaterBlock.prototype.render = function () {
            this.rendered = true;
            this._reload();
        };

        RepeaterBlock.prototype.bind = function () {
            this.bound = true;
            var list = this.getList();
            if (list.wasList) {
                this.events.on(list.list, 'change', this.onChange.bind(this));
            }
            _super.prototype.bind.call(this);
        };

        RepeaterBlock.prototype.update = function () {
            var previous = this._lastList;
            var list = this.getList();

            if (previous !== list.list) {
                if (list.wasList) {
                    this.events.on(list.list, 'change', this.onChange.bind(this));
                }

                if (previous && previous.isList) {
                    this.events.off(previous, 'change');
                }

                this._reload();
            }

            _super.prototype.update.call(this);
        };

        RepeaterBlock.prototype.onChange = function (args) {
            var changeType = args ? args.type : 'reset';

            switch (changeType) {
                case 'insert':
                    this._insertChild(args.item, args.index);
                    break;

                case 'remove':
                    this._removeChild(args.index);
                    break;

                default:
                    this._reload();
                    break;
            }

            this.update();
        };

        RepeaterBlock.prototype.getList = function () {
            var list = this.getValue(this.source);
            this._lastList = list;
            var wasList = true;

            if (!list) {
                list = new List();
                wasList = false;
            }

            if (!list.isList) {
                if (!Array.isArray(list)) {
                    list = [list];
                }
                list = new List(list);
                wasList = false;
            }

            return {
                list: list,
                wasList: wasList
            };
        };

        RepeaterBlock.prototype._insertChild = function (item, index) {
            var previousIndex = index - 1;
            var precedingElement;
            if (previousIndex < 0) {
                precedingElement = this.placeholder;
            } else {
                var previousBlockElements = this.children[previousIndex].elements;
                precedingElement = previousBlockElements[previousBlockElements.length - 1];
            }

            this._currentList.insertAt(index, item);
            var child = new Block(this.view, this);
            this.children.splice(index, 0, child);
            child.scope = {};
            child.scope[this.iterator] = item;
            child.template = BlockProcessor.processTemplate(child, this.blockTemplate);
            if (this.rendered) {
                child.render();
            }
            if (this.bound) {
                child.bind();
            }

            this.parent.insertElements(child.elements, precedingElement);
        };

        RepeaterBlock.prototype._removeChild = function (index) {
            var child = this.children.splice(index, 1)[0];
            this._currentList.removeAt(index);
            child.dispose();
            this.parent.removeElements(child.elements);
            child.parent = null;
            child.view = null;
        };

        RepeaterBlock.prototype._updateChild = function (index, item) {
            var child = this.children[index];
            child.scope[this.iterator] = item;
            child.update();
        };

        RepeaterBlock.prototype._reload = function () {
            var newList = this.getList().list;
            var currentList = this._currentList;

            var count = newList.getCount();

            for (var i = 0; i < count; i++) {
                var newItem = newList.getAt(i);
                var currentItem = currentList.getAt(i);

                var newKey = (newItem.key = newItem.key || i);
                var currentKey = currentItem ? (currentItem.key = currentItem.key || i) : null;

                if (newItem && !currentItem) {
                    this._insertChild(newItem, i);
                } else if (newKey !== currentKey) {
                    if (currentList.findBy('key', newKey) === -1) {
                        this._insertChild(newItem, i);
                    } else {
                        this._removeChild(i--);
                    }
                } else {
                    this._updateChild(i, newItem);
                }
            }

            while (currentList.getCount() > newList.getCount()) {
                this._removeChild(i);
            }
        };
        return RepeaterBlock;
    })(Block);

    
    return RepeaterBlock;
});
