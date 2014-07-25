class EventGroup {
  private static _uniqueId = 0;
  private _parent;
  private _eventRecords: any[];
  private _id = EventGroup._uniqueId++;

  public constructor(parent: any) {
    this._parent = parent;
    this._eventRecords = [];
  }

  public dispose() {
    this.off();
    this._parent = null;
  }

  public on(target: any, eventName: string, callback: (args?: any) => void) {
    var eventRecord = {
      target: target,
      eventName: eventName,
      parent: this._parent,
      callback: callback
    };

    // Initialize and wire up the record on the target, so that it can call the callback if the event fires.
    target.__events = target.__events || {};
    target.__events[eventName] = target.__events[eventName] || { count: 0 };
    target.__events[eventName][this._id] = target.__events[eventName][this._id] || [];
    target.__events[eventName][this._id].push(eventRecord);
    target.__events[eventName].count++;

    if (target.addEventListener) {
      target.addEventListener(eventName, callback);
    }

    // Remember the record locally, so that it can be removed.
    this._eventRecords.push(eventRecord);
  }

  public off(target?: any, eventName?: string, callback?: (args?: any) => void) {
    for (var i = 0; i < this._eventRecords.length; i++) {
      var eventRecord = this._eventRecords[i];
      if ((!target || target === eventRecord.target) &&
          (!eventName || eventName === eventRecord.eventName) &&
          (!callback || callback === eventRecord.callback)) {
        var targetArrayLookup = eventRecord.target.__events[eventRecord.eventName];
        var targetArray = targetArrayLookup[this._id];

        if (targetArray.length === 1 || !callback) {
          delete eventRecord.target.__events[eventRecord.eventName][this._id];
        }
        else {
          targetArray.splice(targetArray.indexOf(eventRecord), 1);
        }

        if (!--targetArrayLookup.count) {
          delete eventRecord.target.__events[eventRecord.eventName];
        }

        if (eventRecord.target.removeEventListener) {
          eventRecord.target.removeEventListener(eventRecord.eventName, eventRecord.callback);
        }

        this._eventRecords.splice(i, 1);
      }
    }
  }

  public raise(eventName: string, eventArgs?: any, bubbleEvent?: boolean): any {
    var parent = this._parent;
    var retVal;

    while (parent && retVal !== false) {
      var eventRecords = parent.__events ? parent.__events[eventName] : null;

      for (var id in eventRecords) {
        var eventRecordList = eventRecords[id];

        for (var listIndex = 0; retVal !== false && listIndex < eventRecordList.length; listIndex++) {
          var record = eventRecordList[listIndex];

          // Call the callback in the context of the parent, using the supplied eventArgs.
          retVal = record.callback.call(record.parent, eventArgs);
        }
      }

      // If the parent has a parent, bubble the event up.
      parent = bubbleEvent ? parent.parent : null;
    }

    return retVal;
  }

  public declare(event: any) {
    var declaredEvents = this._parent.__declaredEvents = this._parent.__declaredEvents || {};

    if (typeof event === 'string') {
      declaredEvents[event] = true;
    }
    else {
      for (var i = 0; i < event.length; i++) {
        declaredEvents[event[i]] = true;
      }
    }
  }

  public autoWire(target?: any, eventNamePrefix?: string) {
    target = target || this._parent;
    eventNamePrefix = 'on' + (eventNamePrefix || '');

    var proto = this._parent.constructor.prototype;

    for (var propertyName in proto) {
      if (typeof proto[propertyName] === 'function' && propertyName.indexOf(eventNamePrefix) === 0) {
        var eventName = propertyName.substr(eventNamePrefix.length,1).toLowerCase() + propertyName.substr(eventNamePrefix.length + 1);

        if (EventGroup.isDeclared(target, eventName)) {
          this.on(this._parent, eventName, this._parent[propertyName]);
        }
      }
    }
  }

  public static isObserved(target: any, eventName: string): boolean {
    return target && target.__events && target.__events[eventName];
  }

  public static isDeclared(target: any, eventName: string): boolean {
    return target && target.__declaredEvents && target.__declaredEvents[eventName];
  }
}

export = EventGroup;
