import EventGroup = require('./EventGroup');
declare class List<T> {
    public isList: boolean;
    public array: T[];
    public events: EventGroup;
    constructor(array?: T[]);
    public clear(): void;
    public getCount(): number;
    public setCount(count: number): void;
    public indexOf(item: T): number;
    public findBy(propertyName: any, propertyValue: any): number;
    public getAt(index: any): T;
    public setAt(index: any, item: T, suppressChange?: boolean): void;
    public setArray(array?: T[]): void;
    public setRange(index: any, items: T[]): void;
    public insertAt(index: any, item: T): void;
    public push(item: T): T;
    public pop(): T;
    public remove(item: T): void;
    public removeAt(index: any): void;
    public change(details?: any): void;
    public childChange(): void;
}
export = List;
