import EventGroup = require('EventGroup');
declare class List {
    public isList: boolean;
    public array: any[];
    public events: EventGroup;
    constructor(array?: any[]);
    public clear(): void;
    public getCount(): number;
    public setCount(count: number): void;
    public indexOf(item: any): number;
    public getAt(index: any): any;
    public setAt(index: any, item: any): void;
    public setRange(index: any, items: any): void;
    public insertAt(index: any, item: any): void;
    public push(item: any): any;
    public pop(): any;
    public remove(item: any): void;
    public removeAt(index: any): void;
    public change(details: any): void;
    public childChange(): void;
}
export = List;
