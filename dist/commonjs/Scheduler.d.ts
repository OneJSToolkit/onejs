export interface ITaskState {
    id: number;
    name: string;
    running: boolean;
    cancelled: boolean;
}
export interface IState {
    tasks: ITaskState[];
}
export interface IQueue {
    before: IQueue;
    after: IQueue;
    schedule(work: Function, insertAtTop?: boolean, name?: string): number;
}
export declare function cancel(id: number): void;
export declare var main: IQueue;
