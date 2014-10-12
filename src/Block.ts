import View = require('./View');
import DomUtils = require('./DomUtils');

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

export enum BlockType {
    Element,
    Text,
    Comment,
    Block,
    IfBlock,
    RepeaterBlock
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
}


export class Block {
    elements: HTMLElement[];
    template: IBlockSpec[];
    children: Block[] = [];
    view: View;
    placeholder: Comment;

    constructor(view: View) {
        this.view = view;
    }

    render() {
        if (!this.elements) {
            this.elements = <any>renderNodes(this.template);
        }
        this.children.forEach((child) => {
            child.render();
        });
    }

    attach() {
        this.children.forEach((child) => {
            child.attach();
        });
    }

    detach() {
        this.children.forEach((child) => {
            child.detach();
        });
    }

    update() {
        this.children.forEach((child) => {
            child.update();
        });
    }

    dispose() {
        this.children.forEach((child) => {
            child.dispose();
        });
    }
}

function renderNodes(nodes: IBlockSpec[]): Node[]{
    if (nodes) {
        return nodes.map((node:IBlockSpec):Node => {
            var children = renderNodes(node.children);
            if (node.type === BlockType.Element) {
                return createElement(node.tag, node.attr, children);
            } else if (node.type === BlockType.Text) {
                return createText(node.value);
            } else if (node.type === BlockType.Comment) {
                var c = createComment(node.value);
                if (node.owner) {
                    node.owner.placeholder = c;
                }
                return c;
            }
        });
    }
}

export class IfBlock extends Block {

    source: string;
    inserted = false;
    rendered = false;

    constructor(view:View, source: string) {
        super(view);

        this.source = source;
    }

    render() {
        if (!this.rendered && this.view.getValue(this.source)) {
            super.render();
            this.insert();
            this.rendered = true;
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
            this.detach();
            this.remove();
        }
    }

    insert() {
        if (!this.inserted) {
            this.inserted = true;
            this.elements.forEach((element) => {
                insertAfter(element, this.placeholder);
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
    if (spec.type === BlockType.Element || spec.type === BlockType.Text) {
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
        } else {
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