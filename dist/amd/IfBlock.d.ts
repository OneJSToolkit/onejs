import Block = require('./Block');
import View = require('./View');
declare class IfBlock extends Block {
    public source: string;
    public inserted: boolean;
    public rendered: boolean;
    public bound: boolean;
    constructor(view: View, parent: Block, source: string);
    public render(): void;
    public bind(): void;
    public update(): void;
    public insert(): void;
    public remove(): void;
}
export = IfBlock;
