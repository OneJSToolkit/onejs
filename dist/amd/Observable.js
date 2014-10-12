define(["require", "exports", './EventGroup'], function(require, exports, EventGroup) {
    var Observable = (function () {
        function Observable(val) {
            this.isObservable = true;
            this._events = new EventGroup(this);
            this._val = val;
            this._events.declare('change');
        }
        Observable.prototype.getValue = function () {
            return this._val;
        };

        Observable.prototype.setValue = function (val) {
            if (val !== this._val) {
                this._val = val;
                this._events.raise('change');
            }
        };
        return Observable;
    })();

    
    return Observable;
});
