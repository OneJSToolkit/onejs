declare var setImmediate;

export interface ITaskState {
    id: number;
    name: string;
    cancelled: boolean;
}

export interface IState {
    tasks: ITaskState[];
    activeTask: ITaskState;
}

interface ITaskMap {
    [key: number]: _Task;
}

var taskMap: ITaskMap = {};

export class _Task implements ITaskState {
    id: number;
    name: string;
    cancelled: boolean;
    work: Function;

    constructor(work: Function, name?: string) {
        this.id = _Task._instanceCount++;
        this.work = work;
        this.name = name;
        this.cancelled = false;
        taskMap[this.id] = this;
    }

    execute() {
        try {
            if (!this.cancelled) {
                this.work.call(null);
            }
        } finally {
            this.dispose();
        }
    }

    dispose() {
        delete taskMap[this.id];
    }

    static _instanceCount = 0;
}

export interface IQueue {
    before: IQueue;
    after: IQueue;
    schedule(work: Function, insertAtTop?: boolean, name?: string): number;
}

export class _Queue implements IQueue {

    _before: _Queue;
    _after: _Queue;
    _work: _Task[] = [];
    _schedulerBackend: _SchedulerBackend;

    constructor(schedulerBackend: _SchedulerBackend) {
        this._schedulerBackend = schedulerBackend;
    }

    get before() {
        return this._before || (this._before = new _Queue(this._schedulerBackend));
    }

    get after() {
        return this._after || (this._after = new _Queue(this._schedulerBackend));
    }

    schedule(work: Function, insertAtTop = false, name?:string):number {
        var task = new _Task(work, name);
        if (insertAtTop) {
            this._work.unshift(task);
        } else {
            this._work.push(task);
        }

        this._schedulerBackend.scheduleRunner();

        return task.id;
    }
}

export class _SchedulerBackend {
    scheduled = false;
    running = false;
    activeTask: _Task = null;
    main: _Queue;
    time_slice = 30;

    buildMain() {
        this.main = new _Queue(this);
        return this.main;
    }

    _setImmediate = (typeof setImmediate !== 'undefined') ? setImmediate : function (callback) { setTimeout(callback, 16); };
    _now = Date.now;

    scheduleRunner() {
        if (!this.running && !this.scheduled) {
            this.scheduled = true;
            this._setImmediate(() => {
                this.run();
            });
        }
    }

    run() {
        this.scheduled = false;
        this.running = true;
        var end = this._now() + this.time_slice;
        var moreItems = true;

        try {
            while (moreItems && (this._now() <= end)) {
                var next = this.nextTask();
                if (next) {
                    this.activeTask = next;
                    next.execute();
                } else {
                    moreItems = false;
                }
            }
        }
        finally {
            this.running = false;
            this.activeTask = null;
            activeQueue = this.main;

            if (moreItems) {
                this.scheduleRunner();
            }
        }
    }

    nextTask(): _Task {
        var queue: _Queue = this.main;
        var parents: _Queue[] = [];

        while (parents.length || queue) {
            if (queue) {
                parents.push(queue);
                queue = queue._before;
            } else {
                queue = parents.pop();
                if (queue._work.length) {
                    activeQueue = queue;
                    return queue._work.shift();
                }
                queue = queue._after;
            }
        }
    }
}

export function cancel(id: number) {
    var task = taskMap[id];
    if (task) {
        task.cancelled = true;
    }
}

export function retrieveState(backend?: _SchedulerBackend): IState {
    if (!backend) {
        backend = schedulerBackend;
    }
    var state: IState = {
        tasks: [],
        activeTask: backend.activeTask
    };
    var queue: _Queue = backend.main;
    var parents: _Queue[] = [];

    while (parents.length || queue) {
        if (queue) {
            parents.push(queue);
            queue = queue._before;
        } else {
            queue = parents.pop();
            queue._work.forEach(function (task) {
                state.tasks.push({
                    id: task.id,
                    name: task.name,
                    cancelled: task.cancelled
                });
            });
            queue = queue._after;
        }
    }

    return state;
}

var schedulerBackend = new _SchedulerBackend();
export var main: _Queue = schedulerBackend.buildMain();
export var activeQueue: IQueue = main;