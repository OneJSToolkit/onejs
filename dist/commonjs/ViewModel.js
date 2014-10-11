var EventGroup = require('./EventGroup');

var ViewModel = (function () {
    function ViewModel(data) {
        this.isViewModel = true;
        this.parentValues = [];
        this.__id = ViewModel.__instanceCount++;
        this.__events = new EventGroup(this);
        this.__events.declare('change');

        if (data) {
            this.setData(data, false);
        }
    }
    ViewModel.prototype.initialize = function () {
        this.setData(this, false, true);

        for (var i = 0; i < this.parentValues.length; i++) {
            var args = { name: this.parentValues[i], val: null };

            this.__events.raise('findValue', args, true);

            if (args.val !== null) {
                var data = {};
                data[args.name] = args.val;
                this.setData(data, false, true);
            } else {
                throw "Unable to find value: " + args.name;
            }
        }

        this.onInitialize();
    };

    ViewModel.prototype.onInitialize = function () {
    };

    ViewModel.prototype.dispose = function () {
        this.__events.dispose();
        this.onDispose();
    };

    ViewModel.prototype.onDispose = function () {
    };

    ViewModel.prototype.setData = function (data, shouldFireChange, forceListen) {
        var hasChanged = false;

        for (var key in data) {
            if (key[0] !== '_') {
                var oldValue = this[key];
                var newValue = data[key];

                if (oldValue !== newValue || forceListen) {
                    if (oldValue && EventGroup.isDeclared(oldValue, 'change')) {
                        this.__events.off(oldValue);
                    }
                    this[key] = newValue;
                    hasChanged = true;
                    if (newValue && EventGroup.isDeclared(newValue, 'change')) {
                        this.__events.on(newValue, 'change', this.change);
                    }
                }
            }
        }

        if ((hasChanged && shouldFireChange !== false) || shouldFireChange === true) {
            this.change();
        }
    };

    ViewModel.prototype.change = function (args) {
        this.__events.raise('change', args);
    };
    ViewModel.__instanceCount = 0;
    return ViewModel;
})();

module.exports = ViewModel;
