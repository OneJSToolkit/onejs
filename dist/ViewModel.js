define(["require", "exports", 'EventGroup'], function(require, exports, EventGroup) {
    var ViewModel = (function () {
        function ViewModel(data) {
            this.events = new EventGroup(this);
            this.events.declare('change');

            this.setData(data);
        }
        ViewModel.prototype.dispose = function () {
            this.events.dispose();
        };

        ViewModel.prototype.setData = function (data, forceChange) {
            var hasChanged = false;

            for (var i in data) {
                if (data.hasOwnProperty(i)) {
                    var oldValue = this[i];
                    var newValue = data[i];

                    if (oldValue !== newValue) {
                        if (oldValue && EventGroup.isDeclared(oldValue, 'change')) {
                            this.events.off(oldValue);
                        }
                        this[i] = newValue;
                        hasChanged = true;
                        if (newValue && EventGroup.isDeclared(newValue, 'change')) {
                            this.events.on(newValue, 'change', this.change);
                        }
                    }
                }
            }

            if (hasChanged || forceChange) {
                this.events.raise('change');
            }
        };

        ViewModel.prototype.onInitialize = function () {
        };
        ViewModel.prototype.onActivate = function (subControls) {
        };
        ViewModel.prototype.onDeactivate = function () {
        };

        ViewModel.prototype.change = function (args) {
            this.events.raise('change', args);
        };
        return ViewModel;
    })();

    
    return ViewModel;
});
