import Block = require('./Block');
import IBlockSpec = require('./IBlockSpec');
import IItem = require('./IItem');
import List = require('./List');
import View = require('./View');
declare class RepeaterBlock extends Block {
    public source: string;
    public iterator: string;
    public blockTemplate: IBlockSpec[];
    public bound: boolean;
    public rendered: boolean;
    public _lastList: any;
    public _currentList: List<IItem>;
    constructor(view: View, parent: Block, source: string, iterator: string, blockTemplate: IBlockSpec[]);
    public render(): void;
    public bind(): void;
    public update(): void;
    public onChange(args?: any): void;
    public getList(): {
        list: List<IItem>;
        wasList: boolean;
    };
    public _insertChild(item: any, index: number): void;
    public _removeChild(index: number): void;
    public _updateChild(index: number, item: any): void;
    public _reload(): void;
}
export = RepeaterBlock;
