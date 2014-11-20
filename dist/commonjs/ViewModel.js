var EventGroup = require('./EventGroup');

var ViewModel = (function () {
    function ViewModel(data) {
        this.isViewModel = true;
        this.parentValues = [];
        this.__id = ViewModel.__instanceCount++;
        this._events = new EventGroup(this);
        this._events.declare('change');

        if (data) {
            this.setData(data, false);
        }
    }
    ViewModel.prototype.findValue = function (valueName) {
        var val = this[valueName];

        if (!val) {
            var args = { name: valueName, val: null };

            this._events.raise('findValue', args, true);

            if (args.val !== null) {
                val = args.val;
            } else {
                throw "Unable to find value: " + args.name;
            }
        }

        return val;
    };

    ViewModel.prototype.initialize = function () {
        for (var i = 0; i < this.parentValues.length; i++) {
            this[this.parentValues[i]] = this.findValue(this.parentValues[i]);
        }

        this.onInitialize();

        this.setData(this, false, true);
    };

    ViewModel.prototype.onInitialize = function () {
    };

    ViewModel.prototype.dispose = function () {
        this._events.dispose();
        this.onDispose();
    };

    ViewModel.prototype.onDispose = function () {
    };

    ViewModel.prototype.setData = function (data, shouldFireChange, forceListen) {
        var hasChanged = false;

        for (var key in data) {
            if (data.hasOwnProperty(key) && key[0] !== '_') {
                var oldValue = this[key];
                var newValue = data[key];

                if (oldValue !== newValue || forceListen) {
                    if (oldValue && EventGroup.isDeclared(oldValue, 'change')) {
                        this._events.off(oldValue, 'change', this.change);
                    }
                    this[key] = newValue;
                    hasChanged = true;
                    if (newValue && EventGroup.isDeclared(newValue, 'change')) {
                        this._events.on(newValue, 'change', this.change);
                    }
                }
            }
        }

        if ((hasChanged && shouldFireChange !== false) || shouldFireChange === true) {
            this.change();
        }
    };

    ViewModel.prototype.change = function (args) {
        this._events.raise('change', args);
    };
    ViewModel.__instanceCount = 0;
    return ViewModel;
})();

module.exports = ViewModel;
