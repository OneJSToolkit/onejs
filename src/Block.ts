import View = require('./View');
import DomUtils = require('./DomUtils');

export interface IBindingEventMap {
    [key: string]: string[];
}

export interface IBinding {
    id?: string;
    className?: IMap;
    css?: IMap;
    text?: string;
    html?: string;
    attr?: IMap;
    events?: IBindingEventMap;
    element?: HTMLElement;
};

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
    elements: HTMLElement[];
    template: IBlockSpec[];
    children: Block[] = [];
    view: View;
    placeholder: Comment;
    bindings: IBinding[] = [];
    _lastValues: any = {};

    constructor(view: View) {
        this.view = view;
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

            for (var bindingType in binding) {
                if (bindingType != 'id' && bindingType != 'events' && bindingType != 'element') {
                    if (bindingType === 'text' || bindingType === 'html') {
                        this._updateViewValue(binding, bindingType, binding[bindingType]);
                    } else {
                        for (var bindingDest in binding[bindingType]) {
                            this._updateViewValue(binding, bindingType, binding[bindingType][bindingDest], bindingDest);
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
    }

    _updateViewValue(binding, bindingType, sourcePropertyName, bindingDest?) {
        var key = binding.id + bindingType + (bindingDest ? ('.' + bindingDest) : '');
        var lastValue = this._lastValues[key];
        var currentValue = this.view.getValue(sourcePropertyName);

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
            for (var bindingType in binding) {
                if (bindingType != 'id' && bindingType != 'events' && bindingType != 'element') {
                    for (var bindingDest in binding[bindingType]) {
                        var source = binding[bindingType][bindingDest];
                        if (source.indexOf('$parent') > -1) {
                            this.view.viewModel.setData({
                                '$parent': (this.view.owner || this.view.parent).viewModel
                            }, false);
                        }
                        if (source.indexOf('$root') > -1) {
                            this.view.viewModel.setData({
                                '$root': this.view._getRoot().viewModel
                            }, false);
                        }
                    }
                }
            }

            if (binding.events) {
                for (var eventName in binding.events) {
                    var targetList = binding.events[eventName];

                    this._bindEvent(targetElement, eventName, targetList);
                }
            }

            this._bindInputEvent(targetElement, binding);
        });
    }

    _bindInputEvent(element, binding) {
        if (binding.attr && (binding.attr.value || binding.attr.checked)) {
            this.view.activeEvents.on(element, 'input,change', function () {
                var source = binding.attr.value ? 'value' : 'checked';
                var newValue = element[source];
                var key = binding.id + 'attr.' + source;

                this._lastValues[key] = newValue;
                this.setValue(binding.attr[source], newValue);

                return false;
            });
        }
    }

    _bindEvent(element, eventName, targetList) {
        var _this = this;

        if (eventName.indexOf('$view.') == 0) {
            eventName = eventName.substr(6);
            element = this;
        }

        this.view.activeEvents.on(element, eventName, function (ev) {
            var returnValue;

            for (var targetIndex = 0; targetIndex < targetList.length; targetIndex++) {
                var target = targetList[targetIndex];
                var args = < any > arguments;

                returnValue = this._getValueFromFunction(target, args);
            }

            return returnValue;
        });
    }

    _processBinding(spec: IBlockSpec, element: HTMLElement): HTMLElement {

        if (spec.binding) {
            spec.binding.id = this.bindings.length.toString();
            spec.binding.element = element;
            this.bindings.push(spec.binding);
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
    bindCalled = false;

    constructor(view:View, source: string) {
        super(view);

        this.source = source;
    }

    render() {
        if (!this.rendered && this.view.getValue(this.source)) {
            super.render();
            this.insert();
            this.rendered = true;
            if (this.bindCalled) {
                super.bind();
            }
        }
    }

    bind() {
        this.bindCalled = true;
        if (this.rendered) {
            super.bind();
        }
    }

    update() {
        var condition = this.view.getValue(this.source);

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
            var lastElement:Node = this.placeholder;
            this.elements.forEach((element) => {
                insertAfter(element, lastElement);
                lastElement = element;
            });
        }
    }

    remove() {
        if (this.inserted) {
            this.inserted = false;
            this.elements.forEach((element) => {
                element.parentNode.removeChild(element);
            });
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

    constructor(view:View, source: string, iterator: string) {
        super(view);

    }
}

export function fromSpec(view: View, spec: IBlockSpec): Block {

    var block: Block;
    if (spec.type === BlockType.Element || spec.type === BlockType.Text || spec.type === BlockType.View) {
        block = new Block(view);
        block.template = processTemplate(block, [spec]);
    } else {
        block = createBlock(view, spec);
        block.template = processTemplate(block, spec.children);
    }

    return block;
}

function createBlock(view: View, spec: IBlockSpec): Block {

    var block: Block;
    switch (spec.type) {
        case BlockType.Block:
            block = new Block(view);
            break;
        case BlockType.IfBlock:
            block = new IfBlock(view, spec.source);
            break;
        case BlockType.RepeaterBlock:
            block = new RepeaterBlock(view, spec.source, spec.iterator);
            break;
    }

    return block;
}

function processTemplate(parent:Block, template: IBlockSpec[]): IBlockSpec[]{

    return template.map(function (spec) {

        if (spec.type === BlockType.Element || spec.type === BlockType.Text) {
            if (spec.children) {
                spec.children = processTemplate(parent, spec.children);
            }
        } else if(spec.type !== BlockType.View) {
            var block = createBlock(parent.view, spec);
            block.template = processTemplate(block, spec.children);
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