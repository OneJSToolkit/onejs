declare class Promise {
    public id: number;
    public isPromise: boolean;
    public _parentPromise: Promise;
    public _state: number;
    public _lastException: any;
    public _thenHandlers: any[];
    public _completeArguments: any[];
    public _progressArguments: any[];
    public _onExecute: () => void;
    public _onCancel: () => void;
    public _complete: (result?: any) => void;
    public _error: () => void;
    public _progress: () => void;
    public _done: any;
    constructor(onExecute?: (complete?: any, error?: any, progress?: any) => any, onCancel?: () => void, parentPromise?: Promise);
    public then(onComplete?: any, onError?: any, onProgress?: any): Promise;
    public wait(milliseconds: any): Promise;
    public cancel(): void;
    public done(onComplete: any, onError?: any, onProgress?: any): Promise;
    public _callPromiseCallbacks(): any;
    public _executePromise(): void;
    static timeout(duration: any, parentPromise?: Promise): Promise;
    static wrap(result: any, parentPromise?: Promise): Promise;
}
export = Promise;
