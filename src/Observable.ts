import EventGroup = require('./EventGroup');

class Observable {
	isObservable = true;

	_events = new EventGroup(this);
	_val;

	constructor(val?: any) {
		this._val = val;
		this._events.declare('change');
	}

	getValue() {
		return this._val;
	}

	setValue(val) {
		if (val !== this._val) {
			this._val = val;
			this._events.raise('change');
		}
	}
}

export = Observable;
