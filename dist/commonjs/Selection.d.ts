import EventGroup = require('EventGroup');
import List = require('List');
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
    public toggle(key: any): void;
    public toggleAllSelected(): void;
    public setSelected(key: any, isSelected?: boolean): void;
    public isAllSelected(): boolean;
    public isSelected(key: any): any;
    public change(): void;
}
export = Selection;
