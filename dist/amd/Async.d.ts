declare class Async {
    public _timeoutIds: any;
    public _throttledFunctions: any;
    public _isDisposed: boolean;
    public _parent: any;
    constructor(parent: any);
    public dispose(): void;
    public setTimeout(callback: any, duration: number): number;
    public clearTimeout(id: any): void;
    public throttle(id: string, waitTime: number, maxWaitTime: number, callback: any, callImmediately?: boolean): void;
    public _callThrottledCallback(id: any): void;
}
export = Async;
