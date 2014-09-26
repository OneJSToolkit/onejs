import EventGroup = require('./EventGroup');

class ViewModel {
    isViewModel = true;
    
    parentValues = [];

    __events: EventGroup;

    private static __instanceCount = 0;
    private __id = ViewModel.__instanceCount++;
    private __initializationData:any;

    public constructor(data ? : any) {
        this.__events = new EventGroup(this);
        this.__events.declare('change');
        this.__initializationData = data;
    }

    public initialize() {

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
            }
            else {
                throw "Unable to find value: " + args.name;
            }
        }

        this.__getDataKeys(this).forEach((key) => {
            var value = this[key];
            // ensure nested ViewModels are initialized
            if (value && (typeof value.initialize === 'function')) {
                value.initialize();
            }
        });

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

        this.__getDataKeys(data).forEach((key) => {
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
        });

        if ((hasChanged && shouldFireChange !== false) || shouldFireChange === true) {
            this.__events.raise('change');
        }
    }

    public __getDataKeys(data: any):string[] {
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
    }


    public change(args ? : any) {
        this.__events.raise('change', args);
    }
}

export = ViewModel;