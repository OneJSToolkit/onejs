import BaseView = require('./BaseView');
import ViewModel = require('./ViewModel');
import EventGroup = require('./EventGroup');
import DomUtils = require('./DomUtils');
import IView = require('./IView');
import IBinding = require('./IBinding');

class View extends BaseView {
	owner;

    _bindings: IBinding[] = [];
    _lastValues = {};
    
    _hasChanged: boolean;  
    _isEvaluatingView: boolean;

    onPostRender() {
    	this.onUpdate();
    }

    onActivate(): void {
        this._bindEvents();
        super.onActivate();
    }

    onViewModelInitialized(viewModel, oldViewModel) {

        if (oldViewModel) {
            this.events.off(oldViewModel);
        }

        this.events.on(viewModel, 'findValue', this.findValue);
    }

    onUpdate() {
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
    }

	onDispose(): void {
		if (this.viewModel) {
			this.viewModel.dispose();
			this.viewModel = null;
		}

        this.events.dispose();
        this.activeEvents.dispose();

    	super.onDispose();
    }

    getValue(propertyName: string): any {
        var targetObject = this._getPropTarget(propertyName);
        var targetValue = (targetObject && targetObject.target) ? targetObject.target[targetObject.propertyName] : '';

        if (typeof targetValue === 'function') {
            targetValue = this._getValueFromFunction(propertyName);
        }

        return targetValue;
    }

    findValue(args) {
        var resource = this.getValue(args.name);

        if (resource === undefined && this.parent && this.parent['findValue']) {
            this.parent['findValue'](args);
        }
        else {
            args.val = resource;
        }
    }

    setValue(propertyName: string, propertyValue: any) {
        var targetObject = this._getPropTarget(propertyName);
        var targetViewModel = targetObject.viewModel;
    
        // TODO, this is a temp fix, less than ideal. If we set command.isExpanded
        // as the property name, we'd have to do what we have below which is to reach
        // in and set the value on the the target. We shouldn't do this.
        // But viewmodel.setData is shallow, so if we passed in { command: { isExpanded: true }},
        // it would stomp on the existing value as it's a new command object.

        if (targetViewModel && typeof targetObject.target[targetObject.propertyName] !== 'function') {
            targetObject.target[targetObject.propertyName] = propertyValue;
            targetViewModel.change();
        }
    }

    toggle(propertyName: string, allowPropogation?: boolean) {
        this.setValue(propertyName, !this.getValue(propertyName));

        allowPropogation = allowPropogation || false;

        return allowPropogation;
    }

    send(sourcePropertyName, destinationPropertyName) {
        this.setValue(destinationPropertyName, this.getValue(sourcePropertyName));
    }

    _updateViewValue(binding, bindingType, sourcePropertyName, bindingDest ? ) {
        var key = binding.id + bindingType + (bindingDest ? ('.' + bindingDest) : '');
        var lastValue = this._lastValues[key];
        var currentValue = this.getValue(sourcePropertyName);

        if (lastValue != currentValue) {
            this._lastValues[key] = currentValue;

        // TODO: enqueue for renderframe update.
            var el = binding.element; // this.subElements[binding.id];

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
    }

    _getPropTarget(propertyName) {
        var view: IView = this;
        var viewModel = view.viewModel;
        var propTarget: any = viewModel;
        var propertyPart;
        var methodIndex = propertyName.indexOf('(');
        var args = null;

        if (methodIndex > -1) {
            args = propertyName.substr(methodIndex + 1, propertyName.length - methodIndex - 2);
            propertyName = propertyName.substr(0, methodIndex);
        }

        var periodIndex = propertyName.indexOf('.');

        while (periodIndex > -1 && propTarget) {
            propertyPart = propertyName.substr(0, periodIndex);

            if (propertyPart === '$debug') {
                debugger;
            } else if (propertyPart === '$parent') {
                view = this.parent.owner || this.parent;
                propTarget = view ? view.viewModel : null;
            } else if (propertyPart === '$root') {
                view = this._getRoot();
                propTarget = view.viewModel;
            } else if (propertyPart === '$view') {
                view = this;
                propTarget = view;
                viewModel = null;
            } else if (propertyPart === '$owner') {
                view = this.owner || this;
                propTarget = view;
                viewModel = null;
            } else {
                propTarget = propTarget[propertyPart];
            }

            if (propTarget && propTarget.isViewModel) {
                viewModel = propTarget;
            }

            propertyName = propertyName.substr(periodIndex + 1);
            periodIndex = propertyName.indexOf('.');
        }

        return {
            originView: this,
            view: view,
            viewModel: viewModel,
            target: propTarget,
            propertyName: propertyName,
            args: args
        };
    }

    _getRoot(): IView {
        var root: IView = this;

        while (root.parent) {
            root = root.parent;
        }

        return root;
    }

    _bindEvents() {
        var _this = this;

        for (var i = 0; i < this._bindings.length; i++) {
            var binding = this._bindings[i];
            var targetElement = binding.element;

            if (!targetElement) {
                targetElement = binding.element = this[binding.id];
            }

            // Observe parent if bindings reference parent.
            // TODO: This should be moved/removed.
            for (var bindingType in binding) {
                if (bindingType != 'id' && bindingType != 'events' && bindingType != 'element') {
                    for (var bindingDest in binding[bindingType]) {
                        var source = binding[bindingType][bindingDest];
                        if (source.indexOf('$parent') > -1) {
                            this.viewModel.setData({
                                '$parent': (this.owner || this.parent).viewModel
                            }, false);
                        }
                        if (source.indexOf('$root') > -1) {
                            this.viewModel.setData({
                                '$root': this._getRoot().viewModel
                            }, false);
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
    }

    _bindInputEvent(element, binding) {
        if (binding.attr && (binding.attr.value || binding.attr.checked)) {
            this.activeEvents.on(element, 'input,change', function() {
                var source = binding.attr.value ? 'value' : 'checked';
                var newValue = element[source];
                var key = binding.id + 'attr.' + source;

                this._lastValues[key] = newValue;
                this.setValue(binding.attr[source], newValue);

                return false;
            });
        }
    }

    _bindEvent(element, eventName, targetList) {
        var _this = this;

        if (eventName.indexOf('$view.') == 0) {
            eventName = eventName.substr(6);
            element = this;
        }

        this.activeEvents.on(element, eventName, function(ev) {
            var returnValue;

            for (var targetIndex = 0; targetIndex < targetList.length; targetIndex++) {
                var target = targetList[targetIndex];
                var args = < any > arguments;

                returnValue = this._getValueFromFunction(target, args);
            }

            return returnValue;
        });
    }

    _getValueFromFunction(target, existingArgs ? ) {
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
                    args.push(this.getValue(providedArgs[i]));
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
    }
}

export = View;
