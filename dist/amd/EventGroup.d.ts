declare class EventGroup {
    private static _uniqueId;
    private _parent;
    private _eventRecords;
    private _id;
    constructor(parent: any);
    public dispose(): void;
    public on(target: any, eventName: string, callback: (args?: any) => void): void;
    public off(target?: any, eventName?: string, callback?: (args?: any) => void): void;
    public raise(eventName: string, eventArgs?: any, bubbleEvent?: boolean): any;
    public declare(event: any): void;
    static raise(target: any, eventName: string, eventArgs?: string, bubbleEvent?: boolean): any;
    static isObserved(target: any, eventName: string): boolean;
    static isDeclared(target: any, eventName: string): boolean;
}
export = EventGroup;
