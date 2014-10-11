import EventGroup = require('./EventGroup');

class ViewModel {
    isViewModel = true;
    
    parentValues = [];

    __events: EventGroup;

    private static __instanceCount = 0;
    private __id = ViewModel.__instanceCount++;

    public constructor(data?: any) {
        this.__events = new EventGroup(this);
        this.__events.declare('change');

        if (data) {
            this.setData(data, false);
        }
    }

    public initialize() {
        this.setData(this, false, true);
 
        for (var i = 0; i < this.parentValues.length; i++) {
            var args = { name: this.parentValues[i], val: null };

            this.__events.raise('findValue', args, true);

            if (args.val !== null) {
                var data = {};
                data[args.name] = args.val;
                this.setData(data, false, true);
            }
            else {
                throw "Unable to find value: " + args.name;
            }
        }

        this.onInitialize();
    }

    public onInitialize() {}

    public dispose() {
        this.__events.dispose();
        this.onDispose();
    }

    public onDispose() {}

    public setData(data: any, shouldFireChange ? : boolean, forceListen?: boolean) {
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
    }

    public change(args ? : any) {
        this.__events.raise('change', args);
    }
}

export = ViewModel;