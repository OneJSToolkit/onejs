import Block = require('./Block');
import BlockProcessor = require('./BlockProcessor');
import IBlockSpec = require('./IBlockSpec');
import IItem = require('./IItem');
import List = require('./List');
import View = require('./View');

class RepeaterBlock extends Block {

    source: string;
    iterator: string;
    blockTemplate: IBlockSpec[];
    bound = false;
    rendered = false;
    _lastList;
    _currentList = new List<IItem>();

    constructor(view: View, parent: Block, source: string, iterator: string, blockTemplate: IBlockSpec[]) {
        super(view, parent);
        this.source = source;
        this.iterator = iterator;
        this.blockTemplate = blockTemplate;
    }

    render() {
        this.rendered = true;
        this._reload();
    }

    bind() {
        this.bound = true;
        var list = this.getList();
        if (list.wasList) {
            this.events.on(list.list, 'change', this.onChange.bind(this));
        }
        super.bind();
    }

    update() {

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

        super.update();
    }

    onChange(args?) {
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
    }

    getList(): { list: List<IItem>; wasList: boolean } {
        var list = this.getValue(this.source);
        this._lastList = list;
        var wasList = true;

        if (!list) {
            list = new List<IItem>();
            wasList = false;
        }

        if (!list.isList) {
            if (!Array.isArray(list)) {
                list = [list];
            }
            list = new List<IItem>(list);
            wasList = false;
        }

        return {
            list: list,
            wasList: wasList
        };
    }

    _insertChild(item, index: number) {

        var previousIndex = index - 1;
        var precedingElement: Node;
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

        this.parent.insertElements(child.elements, <any>precedingElement);
    }

    _removeChild(index: number) {
        var child = this.children.splice(index, 1)[0];
        this._currentList.removeAt(index);
        child.dispose();
        this.parent.removeElements(child.elements);
        child.parent = null;
        child.view = null;
    }

    _updateChild(index: number, item: any) {
        var child = this.children[index];
        child.scope[this.iterator] = item;
        child.update();
    }

    _reload() {
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
    }
}

export = RepeaterBlock;