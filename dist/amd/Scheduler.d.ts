export declare var _TIME_SLICE: number;
export interface ITaskState {
    id: number;
    name: string;
    cancelled: boolean;
}
export interface IState {
    tasks: ITaskState[];
    activeTask: ITaskState;
}
export interface IQueue {
    before: IQueue;
    after: IQueue;
    schedule(work: Function, insertAtTop?: boolean, name?: string): number;
}
export declare var _setImmediate: any;
export declare var _now: any;
export declare function _onIdle(callback: () => void): void;
export declare function cancel(id: number): void;
export declare function retrieveState(): IState;
export declare var main: IQueue;
export declare var activeQueue: IQueue;
