import IView = require('./IView');
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
    elements: HTMLElement[] = [];
    template: IBlockSpec[];
    children: Block[] = [];
    view: IView;
    placeholder: Comment;

    render() {
        this.elements = <any>renderNodes(this.template);
    }
    attach() { }
    detach() { }
    update() { }
    dispose() { }
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

    constructor(source: string) {
        super();
    }
}

export class RepeaterBlock extends Block {

    constructor(source: string, iterator: string) {
        super();

    }
}

export function fromSpec(spec: IBlockSpec): Block {
    // this needs to become a tree walk that separates out child blocks
    var block: Block;
    if (spec.type === BlockType.Element || spec.type === BlockType.Text) {
        block = new Block();
        block.template = processTemplate(block, [spec]);
    } else {
        block = createBlock(spec);
        block.template = processTemplate(block, spec.children);
    }

    return block;
}

function createBlock(spec: IBlockSpec): Block {

    var block: Block;
    switch (spec.type) {
        case BlockType.Block:
            block = new Block();
            break;
        case BlockType.IfBlock:
            block = new IfBlock(spec.source);
            break;
        case BlockType.RepeaterBlock:
            block = new RepeaterBlock(spec.source, spec.iterator);
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
            var block = createBlock(spec);
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