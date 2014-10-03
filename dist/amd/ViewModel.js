define(["require", "exports", './EventGroup'], function(require, exports, EventGroup) {
    var ViewModel = (function () {
        function ViewModel(data) {
            this.isViewModel = true;
            this.parentValues = [];
            this.__id = ViewModel.__instanceCount++;
            this.__events = new EventGroup(this);
            this.__events.declare('change');
            this.__initializationData = data;
        }
        ViewModel.prototype.initialize = function () {
            var _this = this;
            if (this.__initializationData) {
                this.setData(this.__initializationData);
            }

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

            this.__getDataKeys(this).forEach(function (key) {
                var value = _this[key];

                // ensure nested ViewModels are initialized
                if (value && (typeof value.initialize === 'function')) {
                    value.initialize();
                }
            });

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
            var _this = this;
            var hasChanged = false;

            this.__getDataKeys(data).forEach(function (key) {
                var oldValue = _this[key];
                var newValue = data[key];

                if (oldValue !== newValue || forceListen) {
                    if (oldValue && EventGroup.isDeclared(oldValue, 'change')) {
                        _this.__events.off(oldValue);
                    }
                    _this[key] = newValue;
                    hasChanged = true;
                    if (newValue && EventGroup.isDeclared(newValue, 'change')) {
                        _this.__events.on(newValue, 'change', _this.change);
                    }
                }
            });

            if ((hasChanged && shouldFireChange !== false) || shouldFireChange === true) {
                this.change();
            }
        };

        ViewModel.prototype.__getDataKeys = function (data) {
            return Object.keys(data).filter(function (key) {
                var valid = true;

                if (key.indexOf('__') === 0) {
                    valid = false;
                } else if (key === 'setData') {
                    valid = false;
                } else if (key === 'dispose') {
                    valid = false;
                } else if (key === 'change') {
                    valid = false;
                }

                return valid;
            });
        };

        ViewModel.prototype.change = function (args) {
            this.__events.raise('change', args);
        };
        ViewModel.__instanceCount = 0;
        return ViewModel;
    })();

    
    return ViewModel;
});
