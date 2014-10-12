var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BaseView = require('./BaseView');

var DomUtils = require('./DomUtils');

var View = (function (_super) {
    __extends(View, _super);
    function View() {
        _super.apply(this, arguments);
        this._bindings = [];
        this._lastValues = {};
    }
    View.prototype.onPostRender = function () {
        this.onUpdate();
    };

    View.prototype.onActivate = function () {
        this._bindEvents();
        _super.prototype.onActivate.call(this);
    };

    View.prototype.onViewModelInitialized = function (viewModel, oldViewModel) {
        if (oldViewModel) {
            this.events.off(oldViewModel);
        }

        this.events.on(viewModel, 'findValue', this.findValue);
    };

    View.prototype.onUpdate = function () {
        if (this._bindings && this.element) {
            for (var i = 0; this._bindings && i < this._bindings.length; i++) {
                var binding = this._bindings[i];
                if (binding.element) {
                    for (var bindingType in binding) {
                        if (bindingType != 'id' && bindingType != 'events' && bindingType != 'childId' && bindingType != 'element') {
                            if (bindingType === 'text' || bindingType === 'html') {
                                this._updateViewValue(binding, bindingType, binding[bindingType]);
                            } else {
                                for (var bindingDest in binding[bindingType]) {
                                    this._updateViewValue(binding, bindingType, binding[bindingType][bindingDest], bindingDest);
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    View.prototype.onDispose = function () {
        if (this.viewModel) {
            this.viewModel.dispose();
            this.viewModel = null;
        }

        this.events.dispose();
        this.activeEvents.dispose();

        _super.prototype.onDispose.call(this);
    };

    View.prototype.getValue = function (propertyName) {
        var targetObject = this._getPropTarget(propertyName);

        return (targetObject && targetObject.target) ? targetObject.target[targetObject.propertyName] : '';
    };

    View.prototype.resolveValue = function (propertyName) {
        var targetValue = this.getValue(propertyName);

        if (targetValue) {
            if (targetValue.isObservable) {
                targetValue = targetValue.getValue();
            } else if (typeof targetValue === 'function') {
                targetValue = this._getValueFromFunction(propertyName);
            }
        }

        return targetValue;
    };

    View.prototype.findValue = function (args) {
        var resource = this.getValue(args.name);

        if (resource === undefined && this.parent && this.parent['findValue']) {
            this.parent['findValue'](args);
        } else {
            args.val = resource;
        }
    };

    View.prototype.setValue = function (propertyName, propertyValue) {
        var targetObject = this._getPropTarget(propertyName);
        var target = targetObject.target;

        // TODO, this is a temp fix, less than ideal. If we set command.isExpanded
        // as the property name, we'd have to do what we have below which is to reach
        // in and set the value on the the target. We shouldn't do this.
        // But viewmodel.setData is shallow, so if we passed in { command: { isExpanded: true }},
        // it would stomp on the existing value as it's a new command object.
        var targetObjectValue = target[targetObject.propertyName];

        if (targetObjectValue && targetObjectValue.isObservable) {
            targetObjectValue.setValue(propertyValue);
        } else if (typeof target[targetObject.propertyName] !== 'function') {
            target[targetObject.propertyName] = propertyValue;

            if (target.change) {
                target.change();
            }
        }
    };

    View.prototype.toggle = function (propertyName, allowPropogation) {
        this.setValue(propertyName, !this.resolveValue(propertyName));

        allowPropogation = allowPropogation || false;

        return allowPropogation;
    };

    View.prototype.send = function (sourcePropertyName, destinationPropertyName) {
        this.setValue(destinationPropertyName, this.resolveValue(sourcePropertyName));
    };

    View.prototype._updateViewValue = function (binding, bindingType, sourcePropertyName, bindingDest) {
        var key = binding.id + bindingType + (bindingDest ? ('.' + bindingDest) : '');
        var lastValue = this._lastValues[key];
        var currentValue = this.resolveValue(sourcePropertyName);

        if (lastValue != currentValue) {
            this._lastValues[key] = currentValue;

            // TODO: enqueue for renderframe update.
            var el = binding.element;

            switch (bindingType) {
                case 'text':
                    el.textContent = currentValue;
                    break;

                case 'html':
                    el.innerHTML = currentValue;
                    break;

                case 'css':
                    el.style[bindingDest] = currentValue;
                    break;

                case 'className':
                    DomUtils.toggleClass(el, bindingDest, currentValue);
                    break;

                case 'attr':
                    if (bindingDest === "value" || bindingDest === 'checked') {
                        el[bindingDest] = currentValue;
                    } else if (currentValue) {
                        el.setAttribute(bindingDest, currentValue);
                    } else {
                        el.removeAttribute(bindingDest);
                    }
                    break;
            }
        }
    };

    View.prototype._getPropTarget = function (propertyName) {
        // [$scope].prop.prop.func(...)
        // $toggle
        // $member.foo
        var propTarget = this.viewModel;
        var propertyPart;
        var args;
        var viewModel;

        // If $ is provided, default the target to 'this'. this allows for sub views to be accessed
        // and helpers as well.
        if (propertyName[0] == '$') {
            propTarget = this;
            propertyName = propertyName.substr(1);
        }

        var props = propertyName.match(/([\w]+[\(][\w.,\(\)\'\" ]*[\)]|[\w]+)/g);

        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            var parenIndex = prop.indexOf('(');

            // strip functions.
            if (parenIndex > -1) {
                args = prop.substr(parenIndex + 1, prop.length - 2 - parenIndex);
                prop = props[i] = prop.substr(0, parenIndex);
            }

            if (i < (props.length - 1)) {
                propTarget = propTarget[prop];

                if (propTarget && propTarget.viewModel) {
                    // this vm should be observed.
                    propTarget = viewModel = propTarget.viewModel;
                }
            }
        }

        return {
            target: propTarget,
            viewModel: viewModel,
            propertyName: props[props.length - 1],
            args: args
        };
    };

    View.prototype._getRoot = function () {
        var root = this;

        while (root.parent) {
            root = root.parent;
        }

        return root;
    };

    View.prototype._bindEvents = function () {
        var _this = this;

        for (var i = 0; i < this._bindings.length; i++) {
            var binding = this._bindings[i];
            var targetElement = binding.element;

            if (!targetElement) {
                targetElement = binding.element = this[binding.id];
            }

            for (var bindingType in binding) {
                if (bindingType != 'id' && bindingType != 'events' && bindingType != 'element') {
                    for (var bindingDest in binding[bindingType]) {
                        var source = binding[bindingType];

                        if (typeof source !== 'string') {
                            source = source[bindingDest];
                        }

                        var target = this._getPropTarget(source);

                        if (target.viewModel) {
                            var data = {};

                            data[source.replace('.', '-')] = target.viewModel;

                            this.viewModel.setData(data, false);
                        }
                    }
                }
            }

            if (binding.events) {
                for (var eventName in binding.events) {
                    var targetList = binding.events[eventName];

                    this._bindEvent(targetElement, eventName, targetList);
                }
            }

            this._bindInputEvent(targetElement, binding);
        }
    };

    View.prototype._bindInputEvent = function (element, binding) {
        if (binding.attr && (binding.attr.value || binding.attr.checked)) {
            this.activeEvents.on(element, 'input,change', function () {
                var source = binding.attr.value ? 'value' : 'checked';
                var newValue = element[source];
                var key = binding.id + 'attr.' + source;

                this._lastValues[key] = newValue;
                this.setValue(binding.attr[source], newValue);

                return false;
            });
        }
    };

    View.prototype._bindEvent = function (element, eventName, targetList) {
        var _this = this;

        if (eventName.indexOf('$view.') == 0) {
            eventName = eventName.substr(6);
            element = this;
        }

        this.activeEvents.on(element, eventName, function (ev) {
            var returnValue;

            for (var targetIndex = 0; targetIndex < targetList.length; targetIndex++) {
                var target = targetList[targetIndex];
                var args = arguments;

                returnValue = this._getValueFromFunction(target, args);
            }

            return returnValue;
        });
    };

    View.prototype._getValueFromFunction = function (target, existingArgs) {
        var propTarget = this._getPropTarget(target);
        var args = [];
        var returnValue = '';

        if (propTarget.args && propTarget.args.length > 0) {
            var providedArgs = propTarget.args.split(/[\s,]+/);

            for (var i = 0; i < providedArgs.length; i++) {
                var arg = providedArgs[i];

                // pass in literal or resolved property.
                if (arg[0] == "'") {
                    args.push(arg.substr(1, arg.length - 2));
                } else if (arg === 'true' || arg === 'false') {
                    args.push(Boolean(arg));
                } else if (arg.length > 0 && !isNaN(Number(arg))) {
                    args.push(Number(arg));
                } else {
                    args.push(this.resolveValue(providedArgs[i]));
                }
            }
        }

        if (args.length == 0 && existingArgs) {
            args = existingArgs;
        }

        var parentObject = propTarget.target;
        var propertyName = propTarget.propertyName;

        if (parentObject && parentObject[propertyName]) {
            returnValue = parentObject[propertyName].apply(parentObject, args);
        }

        return returnValue;
    };
    return View;
})(BaseView);

module.exports = View;
