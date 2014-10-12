import View = require('./View');
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
}
export declare enum BlockType {
    Element = 0,
    Text = 1,
    Comment = 2,
    Block = 3,
    IfBlock = 4,
    RepeaterBlock = 5,
}
export interface IMap {
    [key: string]: string;
}
export interface IBlockSpec {
    type: BlockType;
    children?: IBlockSpec[];
    tag?: string;
    attr?: IMap;
    binding?: IBinding;
    value?: string;
    owner?: Block;
    source?: string;
    iterator?: string;
}
export declare class Block {
    public elements: HTMLElement[];
    public template: IBlockSpec[];
    public children: Block[];
    public view: View;
    public placeholder: Comment;
    constructor(view: View);
    public render(): void;
    public attach(): void;
    public detach(): void;
    public update(): void;
    public dispose(): void;
}
export declare class IfBlock extends Block {
    public source: string;
    public inserted: boolean;
    public rendered: boolean;
    constructor(view: View, source: string);
    public render(): void;
    public update(): void;
    public insert(): void;
    public remove(): void;
}
export declare class RepeaterBlock extends Block {
    constructor(view: View, source: string, iterator: string);
}
export declare function fromSpec(view: View, spec: IBlockSpec): Block;
