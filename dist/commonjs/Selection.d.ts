import EventGroup = require('./EventGroup');
import List = require('./List');
declare class Selection {
    public selectedKey: any;
    public _selectedItems: {};
    public _selectedCount: number;
    public isMultiSelectEnabled: boolean;
    public _isAllSelected: boolean;
    public _events: EventGroup;
    public _list: List;
    constructor(isMultiSelectEnabled?: boolean);
    public clear(): void;
    public getSelectedKeys(): any[];
    public toggle(key: any): boolean;
    public toggleAllSelected(): boolean;
    public setSelected(key: any, isSelected?: boolean): void;
    public isAllSelected(): boolean;
    public isSelected(key: any): boolean;
    public change(): void;
}
export = Selection;
