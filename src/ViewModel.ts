import EventGroup = require('./EventGroup');

class ViewModel {
    isViewModel = true;
    parent: any;
    parentValues = [];

    _events: EventGroup;

    private static __instanceCount = 0;
    private __id = ViewModel.__instanceCount++;

    public constructor(data?: any) {
        this._events = new EventGroup(this);
        this._events.declare('change');

        if (data) {
            this.setData(data, false);
        }
    }

    public findValue(valueName) {
        var val = this[valueName];

        if (!val) {
            var args = { name: valueName, val: null };

            this._events.raise('findValue', args, true);

            if (args.val !== null) {
                val = args.val;
            }
            else {
                throw "Unable to find value: " + args.name;
            }            
        }

        return val;
    }

    public initialize() {
 
        // The parentValues concept is not great because it's not predictable.
        // This should be removed, but will leave it for now to not break anything.
        for (var i = 0; i < this.parentValues.length; i++) {
            this[this.parentValues[i]] = this.findValue(this.parentValues[i]);
        }

        this.onInitialize();

        this.setData(this, false, true);
    }

    public onInitialize() {}

    public dispose() {
        this._events.dispose();
        this.onDispose();
    }

    public onDispose() {}

    public setData(data: any, shouldFireChange ? : boolean, forceListen?: boolean) {
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
    }

    public change(args ? : any) {
        this._events.raise('change', args);
    }
}

export = ViewModel;