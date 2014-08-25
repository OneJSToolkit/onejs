/// <summary>
/// Bugs often appear in async code when stuff gets disposed, but async operations don't get canceled.
/// This Async mixin solves these issues by tying async code to the lifetime of a disposable object.
/// When the instance of the target class is disposed, all async operations spawned by the helper methods
/// will be canceled.
///
/// Usage:
///
///     mix(YourClass.prototype, JBase.Async);
///
/// Then from your class:
///
///    method: function() {
///        this.setTimeout(function() { ... }, 1000);
///    }
///
/// Then, if your instance is disposed before execution, the callback won't get executed and the timer will be cleared.
///
/// The following methods are mixed into your class definition to consume:
///
///    setTimeout
///    clearTimeout
///    asyncRepeat
///    throttle
///
/// All async operations go through a single processing queue workflow. We execute N milliseconds worth of callbacks
/// before calling setTimeout (or setImmediate if available) to process the next batch. This means we avoid freezing the ui
/// thread and have a single place to optimize how async operations execute.
///
/// There are two categories of operations: foreground and background. Foreground operations are processed first, in the
/// order they are registered. If the operation callback returns "true", meaning it has more work to do, it will execute again while
/// there is time available, and won't move to the next item until it's done. Background operations are processed only if
/// there are nore foreground operations pending. When the operation callback returns "true", it will be pushed back to the end
/// of the queue, meaning that background operations are round-robbined.
///
/// SetTimeout calls and throttled operations are considered foreground operations. Repeats are considered background.
/// </summary>

// Constants for queue timing.
var c_maxDuration = 10;
var c_maxItemsPerIteration = 999999;
var c_timeBetweenIterations = 5;

// Shared queue for monitoring tasks.
var /* @type(Number) */ _queueTimeoutId;
var _allTasks = {};
var _foregroundTasks = [];
var _backgroundTasks = [];

class Async {
    _timeoutIds = null;
    _throttledFunctions = null;
    _isDisposed = false;
    _parent;

    constructor(parent) {
        this._parent = parent || window;
    }

    dispose() {
        /// <summary>Dispose function, clears all async operations.</summary>

        var id;
        var _this = this;

        _this._isDisposed = true;
        _this._parent = null;

        // Clear timeouts.
        if (_this._timeoutIds) {
            for (id in _this._timeoutIds) {
                _this.clearTimeout(id);
            }

            _this._timeoutIds = null;
        }

        // Clear throttled function refrences.
        _this._throttledFunctions = null;
    }

    setTimeout(callback, duration: number): number {
        /// <summary>SetTimeout override, which will auto cancel the timeout during dispose.</summary>
        /// <param name="callback" type="Function">Callback to execute.</param>
        /// <param name="duration" type="Number">Duration in milliseconds.</param>
        /// <returns type="Number">The setTimeout id.</returns>

        var _this = this;
        var timeoutId = 0;

        if (!_this._isDisposed) {
            if (!_this._timeoutIds) {
                _this._timeoutIds = {};
            }

            timeoutId = setTimeout(
                function() {
                    // Time to execute the timeout, enqueue it as a foreground task to be executed.

                    // Now delete the record and call the callback.
                    delete _this._timeoutIds[timeoutId];
                    callback.apply(_this._parent);
                },
                duration);

            _this._timeoutIds[timeoutId] = true;
        }

        return timeoutId;
    }

    clearTimeout(id) {
        /// <summary>Clears the timeout.</summary>
        /// <param name="id" type="Number">Id to cancel.</param>

        var _this = this;

        if (_this._timeoutIds && _this._timeoutIds[id]) {
            clearTimeout(id);
            delete _this._timeoutIds[id];
        }
    }

    throttle(id: string, waitTime: number, maxWaitTime: number, callback, callImmediately?: boolean) {
        /// <summary>Throttles an function so that it is only called every so often.</summary>
        /// <param name="id" type="String">Unique id to track this throttle event. Make sure it's unique per instance you want to keep unique.</param>
        /// <param name="waitTime" type="Number">The minimum number of milliseconds to let pass before calling the callback.</param>
        /// <param name="maxWaitTime" type="Number">
        ///    The max number of millisecond to let pass before calling the callback. Provide 0 for this if you don't care about a max amount (e.g. a
        ///    scroll scenario where you just want to make sure {waitTime} milliseconds pass before calling.) Otherwise provide a millisecond duration
        ///    and the callback's wait time won't exceed this (e.g. an upload scenario might have 500ms waitTime, but a 3 second max so that for a small
        ///    burst of uploads we will throttle until we have 500ms of idle time, or until 3 seconds have passed.)
        /// </param>
        /// <param name="callback" type="... -> *">The callback to call.</param>
        /// <param name="callImmediately" type="Boolean" optional="true">If true, will call the callback immediately, but will prevent it from being called again for the waiting duration.</param>

        var _this = this;

        if (!_this._isDisposed) {
            if (!_this._throttledFunctions) {
                _this._throttledFunctions = {};
            }

            var throttleRecord = _this._throttledFunctions[id];
            var now = new Date().getTime();

            if (!throttleRecord) {
                throttleRecord = _this._throttledFunctions[id] = {
                    lastExecuteTime: now,
                    startTime: now,
                    callback: callback,
                    waitTime: waitTime,
                    maxWaitTime: maxWaitTime,
                    calledCallback: callImmediately
                };

                _this.setTimeout(
                    function() {
                        _this._callThrottledCallback(id);
                    },
                    waitTime);

                if (callImmediately) {
                    callback();
                }
            } else {
                throttleRecord.lastExecuteTime = now;
                throttleRecord.waitTime = waitTime > throttleRecord.waitTime ? waitTime : throttleRecord.waitTime;
                throttleRecord.maxWaitTime = maxWaitTime > throttleRecord.maxWaitTime ? maxWaitTime : throttleRecord.maxWaitTime;

                // Need to update the callback to make sure the most recent closure is used
                throttleRecord.callback = callback;
                throttleRecord.calledCallback = false;
            }
        }
    }

    _callThrottledCallback(id) {
        /// <summary>Calls the callback if the appropriate amount of time has passed, or re-enqueues it.</summary>
        /// <param name="id" type="String">Id of the callback to process.</param>

        var _this = this;

        if (_this._throttledFunctions) {
            var throttleRecord = _this._throttledFunctions[id];
            var now = new Date().getTime();
            var timeSinceStart = now - throttleRecord.startTime;
            var timeSinceLastExecute = now - throttleRecord.lastExecuteTime;

            // Check if the allotted time has passed.
            if ((timeSinceLastExecute >= throttleRecord.waitTime) || (throttleRecord.maxWaitTime && timeSinceStart >= throttleRecord.maxWaitTime)) {
                // We need to delete this first so that a callback can add a new one safely
                delete this._throttledFunctions[id];

                if (!throttleRecord.calledCallback) {
                    throttleRecord.callback.apply(_this._parent);
                }
            } else {
                var waitTime = throttleRecord.waitTime - timeSinceLastExecute;

                if (throttleRecord.maxWaitTime) {
                    waitTime = Math.max(0, Math.min(waitTime, throttleRecord.maxWaitTime - timeSinceStart));
                }

                _this.setTimeout(
                    function() {
                        _this._callThrottledCallback(id);
                    },
                    waitTime);
            }
        }
    }
}

export = Async;