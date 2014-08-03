import EventGroup = require('EventGroup');
declare class ViewModel {
    public data: any;
    public events: EventGroup;
    private static _instanceCount;
    private id;
    constructor(data?: any);
    public dispose(): void;
    public setData(data: any, shouldFireChange?: boolean): void;
    public onInitialize(): void;
    public change(args: any): void;
}
export = ViewModel;
