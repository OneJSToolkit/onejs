import EventGroup = require('EventGroup');

class ViewModel {
    __events: EventGroup;

    private static __instanceCount = 0;
    private __id = ViewModel.__instanceCount++;

    public constructor(data ? : any) {
        this.__events = new EventGroup(this);
        this.__events.declare('change');
        this.setData(data);
    }

    public dispose() {
        this.__events.dispose();
    }

    public setData(data: any, shouldFireChange ? : boolean) {
        var hasChanged = false;

        for (var i in data) {
            if (data.hasOwnProperty(i) &&
                i.indexOf('__') !== 0 &&
                i !== 'setData' &&
                i !== 'dispose' &&
                i !== 'change') {

                var oldValue = this[i];
                var newValue = data[i];

                if (oldValue !== newValue) {
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
    }

    public onInitialize() {}

    public change(args ? : any) {
        this.__events.raise('change', args);
    }
}

export = ViewModel;