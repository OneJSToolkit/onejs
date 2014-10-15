import View = require('./View');
import DomUtils = require('./DomUtils');
import List = require('./List');
import EventGroup = require('./EventGroup');

export interface IBindingEventMap {
    [key: string]: string[];
}

export interface IBinding {
    className?: IMap;
    css?: IMap;
    text?: string;
    html?: string;
    attr?: IMap;
    events?: IBindingEventMap;
};

export class Binding {
    id: string;
    element: HTMLElement;
    desc: IBinding;

    constructor(id: string, element: HTMLElement, desc: IBinding) {
        this.id = id;
        this.element = element;
        this.desc = desc;
    }
}

export enum BlockType {
    Element,
    Text,
    Comment,
    Block,
    IfBlock,
    RepeaterBlock,
    View
}

export interface IMap {
    [key: string]: string;
}

export interface IBlockSpec {
    type: BlockType;
    children?: IBlockSpec[];

    //Element
    tag?: string;
    attr?: IMap;
    binding?: IBinding;

    //Text and Comment
    value?: string;

    //Comment
    owner?: Block;

    //IfBlock and RepeaterBlock
    source?: string;

    //RepeaterBlock
    iterator?: string;

    //View
    name?: string;
}

export class Block {
    parent: Block;
    elements: HTMLElement[];
    template: IBlockSpec[];
    children: Block[] = [];
    view: View;
    placeholder: Comment;
    bindings: Binding[] = [];
    _lastValues: any = {};
    _scope: IMap;
    events = new EventGroup(this);

    constructor(view: View, parent: Block) {
        this.view = view;
        this.parent = parent;
    }

    render() {
        if (!this.elements) {
            this.elements = <any>renderNodes(this, this.template);
        }
        this.children.forEach((child) => {
            child.render();
        });
    }

    bind() {

        this._bindEvents();

        this.children.forEach((child) => {
            child.bind();
        });
    }

    update() {

        this.bindings.forEach((binding) => {

            for (var bindingType in binding.desc) {
                if (bindingType != 'events') {
                    if (bindingType === 'text' || bindingType === 'html') {
                        this._updateViewValue(binding, bindingType, binding.desc[bindingType]);
                    } else {
                        for (var bindingDest in binding.desc[bindingType]) {
                            this._updateViewValue(binding, bindingType, binding.desc[bindingType][bindingDest], bindingDest);
                        }
                    }
                }
            }
        });
        
        this.children.forEach((child) => {
            child.update();
        });
    }

    dispose() {
        this.children.forEach((child) => {
            child.dispose();
        });

        this.events.dispose();
    }

    getValue(propertyName: string) {
        //TODO: allow scope values to be called as functions
        if (this._scope) {
            var found = true;
            var value = propertyName.split('.').reduce((prev:any, current:string):any => {
                if (prev && prev.hasOwnProperty(current)) {
                    return prev[current];
                } else {
                    found = false;
                    return null;
                }
            }, this._scope);

            if (found) {
                return value;
            }
        }

        if (this.parent) {
            return this.parent.getValue(propertyName);
        } else {
            return this.view.getValue(propertyName, true);
        }
    }

    insertElements(elements: HTMLElement[], refElement: HTMLElement) {
        var index = this.elements.indexOf(refElement);
        if (index >= 0) {
            var spliceArgs: any[] = [index + 1, 0];
            this.elements.splice.apply(this.elements, spliceArgs.concat(elements));
        }
        if (refElement.parentNode) {
            var lastElement = refElement;
            elements.forEach((element) => {
                insertAfter(element, lastElement);
                lastElement = element;
            });
        }
    }

    removeElements(elements: HTMLElement[]) {
        //TODO: can we assume we are always removing contiguous elements?
        var index = this.elements.indexOf(elements[0]);
        if (index >= 0) {
            this.elements.splice(index, elements.length);
        }

        elements.forEach((element) => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }

    _updateViewValue(binding, bindingType, sourcePropertyName, bindingDest?) {
        var key = binding.id + bindingType + (bindingDest ? ('.' + bindingDest) : '');
        var lastValue = this._lastValues[key];
        var currentValue = this.getValue(sourcePropertyName);

        if (lastValue != currentValue) {
            this._lastValues[key] = currentValue;

            var el = binding.element;

            switch (bindingType) {
                case 'text':
                    el.textContent = currentValue;
                    break;

                case 'html':
                    el.innerHTML = currentValue;
                    break;

                case 'css':
                    el.style[bindingDest] = currentValue;
                    break;

                case 'className':
                    DomUtils.toggleClass(el, bindingDest, currentValue);
                    break;

                case 'attr':
                    if (bindingDest === "value" || bindingDest === 'checked') {
                        el[bindingDest] = currentValue;
                    } else if (currentValue) {
                        el.setAttribute(bindingDest, currentValue);
                    } else {
                        el.removeAttribute(bindingDest);
                    }
                    break;
            }
        }
    }

    _bindEvents() {

        this.bindings.forEach((binding) => {
            var targetElement = binding.element;

            // Observe parent if bindings reference parent.
            // TODO: This should be moved/removed.
            for (var bindingType in binding.desc) {
                if (bindingType != 'events') {
                    for (var bindingDest in binding.desc[bindingType]) {
                        var source = binding.desc[bindingType];
                        
                        if (typeof source !== 'string') {
                            source = source[bindingDest];
                        }

                        var target = this.view._getPropTarget(source);

                        if (target.viewModel) {
                            var data = {};

                            data[source.replace('.', '-')] = target.viewModel;

                            this.view.viewModel.setData(data, false);
                        }
                    }
                }
            }

            if (binding.desc.events) {
                for (var eventName in binding.desc.events) {
                    var targetList = binding.desc.events[eventName];

                    this._bindEvent(targetElement, eventName, targetList);
                }
            }

            this._bindInputEvent(targetElement, binding);
        });
    }

    _bindInputEvent(element: HTMLElement, binding:Binding) {
        if (binding.desc.attr && (binding.desc.attr['value'] || binding.desc.attr['checked'])) {
            this.events.on(element, 'input,change', () => {
                var source = binding.desc.attr['value'] ? 'value' : 'checked';
                var newValue = element[source];
                var key = binding.id + 'attr.' + source;

                this._lastValues[key] = newValue;
                this.view.setValue(binding.desc.attr[source], newValue);

                return false;
            });
        }
    }

    _bindEvent(element, eventName, targetList) {

        if (eventName.indexOf('$view.') == 0) {
            eventName = eventName.substr(6);
            element = this.view;
        }

        this.events.on(element, eventName, (...args) => {
            var returnValue;

            for (var targetIndex = 0; targetIndex < targetList.length; targetIndex++) {
                var target = targetList[targetIndex];

                returnValue = this.view._getValueFromFunction(target, args);
            }

            return returnValue;
        });
    }

    _processBinding(spec: IBlockSpec, element: HTMLElement): HTMLElement {

        if (spec.binding) {
            var binding = new Binding(this.bindings.length.toString(), element, spec.binding);
            this.bindings.push(binding);
        }

        return element;
    }
}

function renderNodes(block:Block, nodes: IBlockSpec[]): Node[]{
    if (nodes) {
        return nodes.map((node:IBlockSpec):Node => {
            if (node.type === BlockType.Element) {
                var children = renderNodes(block, node.children);
                return block._processBinding(node, createElement(node.tag, node.attr, children));
            } else if (node.type === BlockType.Text) {
                return createText(node.value);
            } else if (node.type === BlockType.Comment) {
                var c = createComment(node.value);
                if (node.owner) {
                    node.owner.placeholder = c;
                }
                return c;
            } else if (node.type === BlockType.View) {
                return block.view[node.name].render();
            }
        });
    }
}

export class IfBlock extends Block {

    source: string;
    inserted = false;
    rendered = false;
    bound = false;

    constructor(view:View, parent:Block, source: string) {
        super(view, parent);

        this.source = source;
    }

    render() {
        if (!this.rendered && this.view.getValue(this.source, true)) {
            super.render();
            this.insert();
            this.rendered = true;
            if (this.bound) {
                super.bind();
            }
        }
    }

    bind() {
        this.bound = true;
        if (this.rendered) {
            super.bind();
        }
    }

    update() {
        var condition = this.view.getValue(this.source, true);

        if (condition && !this.inserted) {
            if (this.rendered) {
                this.insert();
            } else {
                this.render();
            }
        } else if (!condition && this.inserted) {
            this.remove();
        }

        if (condition) {
            super.update();
        }
    }

    insert() {
        if (!this.inserted) {
            this.inserted = true;
            this.parent.insertElements(this.elements, <any>this.placeholder);
        }
    }

    remove() {
        if (this.inserted) {
            this.inserted = false;
            this.parent.removeElements(this.elements);
        }
    }
}

function insertAfter(newChild: Node, sibling: Node) {
    var parent = sibling.parentNode;
    var next = sibling.nextSibling;
    if (next) {
        // IE does not like undefined for refChild
        parent.insertBefore(newChild, next);
    } else {
        parent.appendChild(newChild);
    } 
}

export class RepeaterBlock extends Block {

    source: string;
    iterator: string;
    blockTemplate: IBlockSpec[];
    bound = false;
    rendered = false;
    _currentList = new List();

    constructor(view:View, parent: Block, source: string, iterator: string, blockTemplate:IBlockSpec[]) {
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
        this.events.on(this.getList(), 'change', this.onChange.bind(this));
        super.bind();
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

    getList(): List {
        return this.view.getValue(this.source, true);
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
        child._scope = {};
        child._scope[this.iterator] = item;
        child.template = processTemplate(child, this.blockTemplate);
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
        child._scope[this.iterator] = item;
        child.update();
    }

    _reload() {
        var newList = this.getList();
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

export function fromSpec(view: View, spec: IBlockSpec): Block {

    var block: Block;
    if (spec.type === BlockType.Element || spec.type === BlockType.Text || spec.type === BlockType.View) {
        block = new Block(view, null);
        block.template = processTemplate(block, [spec]);
    } else {
        block = createBlock(view, null, spec);
        block.template = processTemplate(block, spec.children);
    }

    return block;
}

function createBlock(view: View, parent: Block, spec: IBlockSpec): Block {

    var block: Block;
    switch (spec.type) {
        case BlockType.Block:
            block = new Block(view, parent);
            break;
        case BlockType.IfBlock:
            block = new IfBlock(view, parent, spec.source);
            break;
        case BlockType.RepeaterBlock:
            block = new RepeaterBlock(view, parent, spec.source, spec.iterator, spec.children);
            break;
    }

    return block;
}

function processTemplate(parent:Block, template: IBlockSpec[]): IBlockSpec[]{

    return template.map(function (spec) {

        if (spec.type === BlockType.Element) {
            if (spec.children) {
                spec.children = processTemplate(parent, spec.children);
            }
        } else if(spec.type === BlockType.Block || spec.type === BlockType.IfBlock || spec.type === BlockType.RepeaterBlock) {
            var block = createBlock(parent.view, parent, spec);
            if (spec.type !== BlockType.RepeaterBlock) {
                block.template = processTemplate(block, spec.children);
            }
            parent.children.push(block);
            spec = {
                type: BlockType.Comment,
                owner: block,
                value: 'block'
            };
        }
        return spec;
    });
}

function createElement(tagName: string, attributes?: IMap, children?: Node[]): HTMLElement {
    var el = document.createElement(tagName);

    if (attributes) {
        Object.keys(attributes).forEach(function (attribute) {
            el.setAttribute(attribute, attributes[attribute]);
        });
    }

    if (children) {
        children.forEach(function (child) {
            el.appendChild(child);
        });
    }

    return el;
}

function createText(value: string): Text {
    return document.createTextNode(value);
}

function createComment(value: string): Comment {
    return document.createComment(value);
}