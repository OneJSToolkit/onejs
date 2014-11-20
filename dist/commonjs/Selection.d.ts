import EventGroup = require('./EventGroup');
import List = require('./List');
declare class Selection {
    public selectedKey: any;
    public _selectedItems: {};
    public _selectedCount: number;
    public isMultiSelectEnabled: boolean;
    public _isAllSelected: boolean;
    public _events: EventGroup;
    public _list: List<any>;
    constructor(isMultiSelectEnabled?: boolean);
    public setList(list?: List<any>): void;
    public clear(suppressChange?: boolean): void;
    public getCount(): number;
    public getSelectedKeys(): any[];
    public toggle(key: any): boolean;
    public toggleAllSelected(): boolean;
    public setSelected(key: any, isSelected?: boolean): void;
    public isAllSelected(): boolean;
    public isSelected(key: any): boolean;
    public change(): void;
    public _onListChanged(ev: any): void;
    public _evaluateSelection(): void;
}
export = Selection;
