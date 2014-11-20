declare var setImmediate;

var TIME_SLICE = 30;

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
    [key: number]: Task;
}

var taskMap: ITaskMap = {};

class Task implements ITaskState {
    id: number;
    name: string;
    cancelled: boolean;
    work: Function;

    constructor(work: Function, name?: string) {
        this.id = Task._instanceCount++;
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

class Queue implements IQueue {

    _before: Queue;
    _after: Queue;
    _work: Task[] = [];

    get before() {
        return this._before || (this._before = new Queue());
    }

    get after() {
        return this._after || (this._after = new Queue());
    }

    schedule(work: Function, insertAtTop = false, name?:string):number {
        var task = new Task(work, name);
        if (insertAtTop) {
            this._work.unshift(task);
        } else {
            this._work.push(task);
        }

        scheduleRunner();

        return task.id;
    }
}

var scheduled = false;
var running = false;
var activeTask: Task = null;

var _setImmediate = (typeof setImmediate !== 'undefined') ? setImmediate : function (callback) { setTimeout(callback, 16); };
var _now = Date.now.bind(Date);

function scheduleRunner() {
    if (!running && !scheduled) {
        scheduled = true;
        _setImmediate(run);
    }
}

function nextTask(): Task {

    var queue:Queue = <any>main;
    var parents: Queue[] = [];

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

function run() {
    scheduled = false;
    running = true;
    var end = _now() + TIME_SLICE;
    var moreItems = true;

    try {
        while (moreItems && (_now() <= end)) {
            var next = nextTask();
            if (next) {
                activeTask = next;
                next.execute();
            } else {
                moreItems = false;
            }
        }
    }
    finally {
        running = false;
        activeTask = null;
        activeQueue = main;

        if (moreItems) {
            scheduleRunner();
        }
    }
}

export function cancel(id: number) {
    var task = taskMap[id];
    if (task) {
        task.cancelled = true;
    }
}

export function retrieveState(): IState {
    var state: IState = {
        tasks: [],
        activeTask: activeTask
    };
    var queue: Queue = <any>main;
    var parents: Queue[] = [];

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

export var main: IQueue = new Queue();
export var activeQueue: IQueue = main;