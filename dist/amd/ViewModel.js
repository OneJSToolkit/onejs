define(["require", "exports", 'EventGroup'], function(require, exports, EventGroup) {
    var ViewModel = (function () {
        function ViewModel(data) {
            this.isViewModel = true;
            this.__id = ViewModel.__instanceCount++;
            this.__events = new EventGroup(this);
            this.__events.declare('change');
            this.setData(data);
        }
        ViewModel.prototype.initialize = function () {
            this.setData(this, false, true);
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

            for (var i in data) {
                if (data.hasOwnProperty(i) && i.indexOf('__') !== 0 && i !== 'setData' && i !== 'dispose' && i !== 'change') {
                    var oldValue = this[i];
                    var newValue = data[i];

                    if (oldValue !== newValue || forceListen) {
                        if (oldValue && EventGroup.isDeclared(oldValue, 'change')) {
                            this.__events.off(oldValue);
                        }
                        this[i] = newValue;
                        hasChanged = true;
                        if (newValue && EventGroup.isDeclared(newValue, 'change')) {
                            this.__events.on(newValue, 'change', this.change);
                        }
                    }
                }
            }

            if ((hasChanged && shouldFireChange !== false) || shouldFireChange === true) {
                this.__events.raise('change');
            }
        };

        ViewModel.prototype.change = function (args) {
            this.__events.raise('change', args);
        };
        ViewModel.__instanceCount = 0;
        return ViewModel;
    })();

    
    return ViewModel;
});
