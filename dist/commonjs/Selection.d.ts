import EventGroup = require('EventGroup');
declare class Selection {
    public selectedItem: any;
    public _selectedItems: {};
    public _singleSelect: boolean;
    public _events: EventGroup;
    constructor();
    public clear(): void;
    public getSelectedItems(): any[];
    public setSelected(item: any, isSelected?: boolean): void;
    public isSelected(item: any): boolean;
}
export = Selection;
