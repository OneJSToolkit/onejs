import EventGroup = require('./EventGroup');
declare class ViewModel {
    public isViewModel: boolean;
    public parentValues: any[];
    public __events: EventGroup;
    private static __instanceCount;
    private __id;
    private __initializationData;
    constructor(data?: any);
    public initialize(): void;
    public onInitialize(): void;
    public dispose(): void;
    public onDispose(): void;
    public setData(data: any, shouldFireChange?: boolean, forceListen?: boolean): void;
    public __getDataKeys(data: Object): string[];
    public change(args?: any): void;
}
export = ViewModel;
