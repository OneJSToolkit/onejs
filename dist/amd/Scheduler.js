define(["require", "exports"], function(require, exports) {
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

        Queue.prototype.retrieveState = function () {
        };
        return Queue;
    })();

    var scheduled = false;
    var running = false;

    var _setImmediate = setImmediate || function (callback) {
        setTimeout(callback, 16);
    };

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
                    return queue._work.shift();
                }
                queue = queue._after;
            }
        }
    }

    function run() {
        scheduled = false;
        running = true;
        var end = Date.now() + TIME_SLICE;
        var moreItems = true;

        try  {
            while (moreItems && (Date.now() <= end)) {
                var next = nextTask();
                if (next) {
                    next.execute();
                } else {
                    moreItems = false;
                }
            }
        } finally {
            running = false;

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

    exports.main = new Queue();
});
