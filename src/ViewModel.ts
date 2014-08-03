import EventGroup = require('EventGroup');

class ViewModel {
  public data: any = {};
  public events: EventGroup;

  private static _instanceCount = 0;
  private id = ViewModel._instanceCount++;

  public constructor(data?: any) {
    this.events = new EventGroup(this);
    this.events.declare('change');
    this.setData(data);
  }

  public dispose() {
    this.events.dispose();
  }

  public setData(data: any, shouldFireChange?: boolean) {
    var hasChanged = false;

    for (var i in data) {
      if (data.hasOwnProperty(i)) {
        var oldValue = this.data[i];
        var newValue = data[i];

        if (oldValue !== newValue) {
          if (oldValue && EventGroup.isDeclared(oldValue, 'change')) {
            this.events.off(oldValue);
          }
          this.data[i] = newValue;
          hasChanged = true;
          if (newValue && EventGroup.isDeclared(newValue, 'change')) {
            this.events.on(newValue, 'change', this.change);
          }
        }
      }
    }

    if ((hasChanged && shouldFireChange !== false) || shouldFireChange === true) {
      this.events.raise('change');
    }
  }

  public onInitialize() {}

  public change(args) {
    this.events.raise('change', args);
  }
}

export = ViewModel;
