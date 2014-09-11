/// <summary>
/// Asynchronous promise support.
///
/// To expose an asynchronous promise-based function, you implement it as such:
///
/// function startAsyncOperation() {
///    return new Promise(
///        function onExecute(complete, error) { /* start your operation here. When done, call complete. If failed, call error. */ },
///        function onCancel() { /* will be called if promise.cancel() is called. */ });
/// }
///
/// To use the asynchronous function, the caller can use the promise "then" method and "done" method to provide callbacks
/// that will be executed when the operation is complete. Example:
///
/// startAsyncOperation()
///     .then(function() { /* success */ }, function() { /* failure */ });
///
/// Multiple operations can be serially chained together if the success callback returns another promise:
///
/// startAsyncOperation()
///     .then(function() { return startAsyncOperation })
///     .done(function() { /* called when all succeed */ }, function() { /* called when any fail. */ });
///
/// </summary>

var PromiseState = {
    executing: 1,
    complete: 2,
    error: 3,
    cancelled: 4
};

var _promiseId = 0;

class Promise {
    id: number;
    isPromise = true;

    _state = PromiseState.executing;

    _lastException;
    _thenHandlers = [];
    _completeArguments = [];
    _progressArguments = [];

    _onExecute: () => void;
    _onCancel: () => void;

    _complete: (result?) => void;
    _error: () => void;
    _progress: () => void;
    
    _done;

    constructor(onExecute ? : (complete?, error?, progress?) => any, onCancel ? : () => void) {
        /// <summary>Promise constructor.</summary>
        /// <param name="onExecute" type="Function">
        /// Function callback that will be executed immediately to start the promise. It should be implemented like so:
        ///    function(complete, error) { /* call complete(...) when done, or error(...) when failed. */ }
        /// </param>
        /// <param name="onExecute" type="void -> Promise" optional="true">Function callback that will be executed if the promise is completed.</param>
        /// <param name="onCancel" type="void -> void" optional="true">Function callback that will be executed if the promise is canceled.</param>

        var _this = this;

        _this._onExecute = onExecute;
        _this._onCancel = onCancel;
        _this._complete = _bind(_this, _complete);
        _this._error = _bind(_this, _error);
        _this._progress = _bind(_this, _progress);
        _this._done = null;

        _this._executePromise();
    }

    then(onComplete?, onError?, onProgress?): Promise {
        /// <summary>
        /// Allows the caller to provide a complete, error, and progress callback that will be called when the
        /// promise transitions (or is already in) the appropriate state. If the complete callback returns another promise,
        /// the new promise will be added to the chain, preventing further operations from beginning to execute until
        /// it is also complete.
        /// </summary>
        /// <param name="onComplete" type="Function" optional="true">Complete function.</param>
        /// <param name="onError" type="Function" optional="true">Error function.</param>
        /// <param name="onProgress" type="Function" optional="true">Progress function.</param>
        /// <returns type="Promise">The current promise.</returns>

        var _this = this;
        var _complete;
        var _fail;
        var _progress;

        var promise = new Promise(function(complete, fail, progress) {
            _complete = complete;
            _fail = fail;
            _progress = progress;
        }, function cancel() {
            _this.cancel();
        });

        _this._thenHandlers.push({
            onComplete: function() {
                var onCompletePromise = (onComplete ? onComplete.apply(this, arguments) : null);

                if (onCompletePromise) {
                    onCompletePromise.then(_complete, _fail, _progress);
                } else {
                    _complete();
                }
            },
            onError: function() {
                onError && onError.apply(this, arguments);
                _fail.apply(this, arguments);
            },
            onProgress: function() {
                onProgress && onProgress.apply(this, arguments);
                _progress.apply(this, arguments);
            }
        });

        _this._callPromiseCallbacks();

        return promise;
    }

    wait(milliseconds) {
    	return Promise.timeout(milliseconds);
    }

    cancel() {
        /// <summary>Allows the caller to cancel a promise. If the promise is not already complete, it will error out and error handlers will be called.</summary>              

        var _this = this;

        if (_this._state !== PromiseState.complete) {
            _this._state = PromiseState.cancelled;

            if (_this._onCancel) {
                _this._onCancel();
                _this._onCancel = null;

                _this._completeArguments = [new Error('Canceled')];
            }
        }

        _this._callPromiseCallbacks();
    }

    done(onComplete, onError, onProgress) {
        /// <summary>Allows the caller to provide callbacks that should execute when the chain is complete.</summary>
        /// <param name="onComplete" type="Function">Complete handler.</param>
        /// <param name="onError" type="Function" optional="true">Error handler.</param>
        /// <param name="onProgress" type="Function" optional="true">Progress handler.</param>
        /// <returns type="Promise">The current promise.</returns>

        var _this = this;

        _this._done = {
            onComplete: onComplete,
            onError: onError,
            onProgress: onProgress
        };

        _this._callPromiseCallbacks();

        return _this;
    }

    _callPromiseCallbacks() {
        /// <summary>Call the promise callbacks if applicable.</summary>

        var _this = this;
        var lastResult;
        var callback;
        var handler;

        if (_this._state == PromiseState.executing) {
            // If we have progress arguments, apply them to any handlers (don't remove the handlers.)
            if (_this._progressArguments) {
                for (var i = 0; i < _this._thenHandlers.length; i++) {
                    handler = _this._thenHandlers[i];

                    handler.onProgress && handler.onProgress.apply(_this, _this._progressArguments);
                }

                _this._progressArguments = null;
            }
        } else {
            while (_this._thenHandlers.length) {
                handler = _this._thenHandlers.shift();

                switch (_this._state) {
                    case PromiseState.complete:
                        callback = handler.onComplete;
                        break;

                    case PromiseState.cancelled:
                    case PromiseState.error:
                        callback = handler.onError;
                        break;
                }

                if (callback) {
                    lastResult = callback.apply(_this, _this._completeArguments);
                }
            }

            if (_this._done) {
                callback = (_this._state === PromiseState.complete || _this._state === PromiseState.cancelled) ? _this._done.onComplete : _this._done.onError;

                if (callback) {
                    callback.apply(_this, _this._completeArguments);
                } else if (_this._state === PromiseState.error) {
                    throw {
                        message: "Promise failed, but done.onError was not implemented.",
                        promise: _this
                    };
                }

                _this._done = null;
            }
        }

        return lastResult;
    }

    _executePromise() {
        /// <summary>Executes the promise onExecute callback.</summary>

        var _this = this;

        try {
            if (_this._onExecute) {
                _this._onExecute.call(_this, _this._complete, _this._error, _this._progress);
            }
            else {
                _this._complete();
            }
        } catch ( /* @type(Error) */ e) {
            _this._lastException = e;
            _this._state = PromiseState.error;
        }

        _this._callPromiseCallbacks();
    }

    static timeout(duration) {
        /// <summary>Creates a promise that will wait for the given amount of time before completing.</summary>
        /// <param name="duration" type="Number">Duration in milliseconds.</param>
        /// <returns type="Promise">The timeout promise.</returns>

        var /* @type(Number) */ timeoutId;
        /* @disable(0092) */
        var startTimeout = (!duration && !!window.setImmediate) ? window.setImmediate : window.setTimeout;
        var cancelTimeout = (!duration && !!window.clearImmediate) ? window.clearImmediate : window.clearTimeout;
        /* @restore(0092) */

        return new Promise(
            function onExecute(complete, error) {
                timeoutId = !!startTimeout(complete, duration);
            },
            function onCancel() {
                cancelTimeout(timeoutId);
            });
    }

    static wrap(result) {
        /// <param name="result" type="*" optional="true">Returns a completed promise that wraps the result.</param>

        var promise = new Promise();

        promise._complete(result);

        return promise;
    }

}

function _complete() {
    /// <summary>Function passed to the execute method for it to call when it is complete.</summary>

    var _this = this;

    if (_this._state === PromiseState.executing) {
        _this._state = PromiseState.complete;
        _this._completeArguments = arguments;
        _this._callPromiseCallbacks();
    }
}

function _error() {
    /// <summary>Function passed to the execute method for it to call when it fails.</summary>

    var _this = this;

    if (_this._state === PromiseState.executing) {
        _this._state = PromiseState.error;
        _this._completeArguments = arguments;
        _this._callPromiseCallbacks();
    }
}

function _progress() {
    /// <summary>Function passed to the execute method for it to call when progress needs to be reported.</summary>

    var _this = this;

    if (_this._state === PromiseState.executing) {
        _this._progressArguments = arguments;
        _this._callPromiseCallbacks();
    }
}

function _bind(obj, func) {
	return function() {
		return func.apply(obj, arguments);
	};
}

export = Promise;
