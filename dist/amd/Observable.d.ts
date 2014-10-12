import EventGroup = require('./EventGroup');
declare class Observable {
    public isObservable: boolean;
    public _events: EventGroup;
    public _val: any;
    constructor(val: any);
    public getValue(): any;
    public setValue(val: any): void;
}
export = Observable;
