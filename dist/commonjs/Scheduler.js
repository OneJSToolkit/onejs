var TIME_SLICE = 30;

var taskMap = {};

var Task = (function () {
    function Task(work, name) {
        this.id = Task._instanceCount++;
        this.work = work;
        this.name = name;
        this.cancelled = false;
        taskMap[this.id] = this;
    }
    Task.prototype.execute = function () {
        try  {
            if (!this.cancelled) {
                this.work.call(null);
            }
        } finally {
            this.dispose();
        }
    };

    Task.prototype.dispose = function () {
        delete taskMap[this.id];
    };

    Task._instanceCount = 0;
    return Task;
})();

var Queue = (function () {
    function Queue() {
        this._work = [];
    }
    Object.defineProperty(Queue.prototype, "before", {
        get: function () {
            return this._before || (this._before = new Queue());
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Queue.prototype, "after", {
        get: function () {
            return this._after || (this._after = new Queue());
        },
        enumerable: true,
        configurable: true
    });

    Queue.prototype.schedule = function (work, insertAtTop, name) {
        if (typeof insertAtTop === "undefined") { insertAtTop = false; }
        var task = new Task(work, name);
        if (insertAtTop) {
            this._work.unshift(task);
        } else {
            this._work.push(task);
        }

        scheduleRunner();

        return task.id;
    };
    return Queue;
})();

var scheduled = false;
var running = false;
var activeTask = null;

var _setImmediate = setImmediate || function (callback) {
    setTimeout(callback, 16);
};
var _now = Date.now.bind(Date);

function scheduleRunner() {
    if (!running && !scheduled) {
        scheduled = true;
        _setImmediate(run);
    }
}

function nextTask() {
    var queue = exports.main;
    var parents = [];

    while (parents.length || queue) {
        if (queue) {
            parents.push(queue);
            queue = queue._before;
        } else {
            queue = parents.pop();
            if (queue._work.length) {
                exports.activeQueue = queue;
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

    try  {
        while (moreItems && (_now() <= end)) {
            var next = nextTask();
            if (next) {
                activeTask = next;
                next.execute();
            } else {
                moreItems = false;
            }
        }
    } finally {
        running = false;
        activeTask = null;
        exports.activeQueue = exports.main;

        if (moreItems) {
            scheduleRunner();
        }
    }
}

function cancel(id) {
    var task = taskMap[id];
    if (task) {
        task.cancelled = true;
    }
}
exports.cancel = cancel;

function retrieveState() {
    var state = {
        tasks: [],
        activeTask: activeTask
    };
    var queue = exports.main;
    var parents = [];

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
exports.retrieveState = retrieveState;

exports.main = new Queue();
exports.activeQueue = exports.main;
