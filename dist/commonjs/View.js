var ViewModel = require('./ViewModel');
var EventGroup = require('./EventGroup');
var DomUtils = require('./DomUtils');

var ViewState;
(function (ViewState) {
    ViewState[ViewState["CREATED"] = 0] = "CREATED";
    ViewState[ViewState["INACTIVE"] = 1] = "INACTIVE";
    ViewState[ViewState["ACTIVE"] = 2] = "ACTIVE";
    ViewState[ViewState["DISPOSED"] = 3] = "DISPOSED";
})(ViewState || (ViewState = {}));

var View = (function () {
    function View(viewModel) {
        this.viewName = 'View';
        this.viewModelType = ViewModel;
        this.subElements = {};
        this._bindings = [];
        this._lastValues = {};
        this._state = 0 /* CREATED */;
        this.events = new EventGroup(this);
        this.activeEvents = new EventGroup(this);
        this.children = [];
        this._inheritedModel = viewModel;
    }
    View.prototype.dispose = function () {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].dispose();
        }

        if (this._state !== 3 /* DISPOSED */) {
            if (this._state == 2 /* ACTIVE */) {
                this.deactivate();
            }

            this._state = 3 /* DISPOSED */;

            this.onDispose();
            this.clearChildren();
            this.events.dispose();
            this.activeEvents.dispose();

            if (!this._inheritedModel) {
                this._viewModel.dispose();
            }

            if (this.element) {
                this.element['control'] = null;
                this.element = null;
            }

            this.subElements = null;
        }
    };

    View.prototype.onInitialize = function () {
    };
    View.prototype.onRender = function () {
        this.element = this._ce('div');
    };
    View.prototype.onResize = function () {
    };
    View.prototype.onActivate = function () {
    };
    View.prototype.onDeactivate = function () {
    };
    View.prototype.onDispose = function () {
    };
    View.prototype.onViewModelChanged = function (changeArgs) {
    };

    View.prototype.setData = function (data, forceUpdate) {
        if (this._state !== 3 /* DISPOSED */) {
            this.initialize();
            this._viewModel.setData(data, forceUpdate);
        }
    };

    View.prototype.initialize = function () {
        if (this._state === 0 /* CREATED */) {
            this._state = 1 /* INACTIVE */;

            this.id = this.viewName + '-' + (View._instanceCount++);

            this._viewModel = this._inheritedModel ? this._inheritedModel : new this.viewModelType();
            this.events.on(this._viewModel, 'change', this.evaluateView);
            this.events.on(this._viewModel, 'findValue', this.findValue);
            this._viewModel.initialize();
            this.onViewModelChanged();
            this.onInitialize();

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].initialize();
            }
        }
    };

    View.prototype.render = function () {
        if (this._state !== 3 /* DISPOSED */) {
            this.initialize();
            this.onRender();
            this.updateView();
            this.element['control'] = this;
        }

        return this.element;
    };

    View.prototype.activate = function () {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].activate();
        }

        if (this._state === 1 /* INACTIVE */) {
            this._state = 2 /* ACTIVE */;

            this._bindEvents();
            this.onActivate();
        }
    };

    View.prototype.deactivate = function () {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].deactivate();
        }

        if (this._state === 2 /* ACTIVE */) {
            this._state = 1 /* INACTIVE */;

            this.onDeactivate();

            this.activeEvents.off();
        }
    };

    View.prototype.resize = function () {
        if (this._state === 2 /* ACTIVE */) {
            this.onResize();

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].resize();
            }
        }
    };

    View.prototype.addChild = function (view, owner, index) {
        view.parent = this;
        view.owner = owner;

        if (index !== undefined) {
            this.children.splice(index, 0, view);
        } else {
            this.children.push(view);
        }

        return view;
    };

    View.prototype.removeChild = function (view) {
        var childIndex = this.children.indexOf(view);
        var child = this.children[childIndex];

        if (childIndex > -1) {
            this.children.splice(childIndex, 1)[0].parent = null;
        }

        return view;
    };

    View.prototype.clearChildren = function () {
        while (this.children.length > 0) {
            this.removeChild(this.children[0]);
        }
    };

    View.prototype.evaluateView = function (changeArgs) {
        this.onViewModelChanged(changeArgs);
        this.updateView();
    };

    View.prototype.updateView = function (updateValuesOnly) {
        if (this._bindings && this.element) {
            for (var i = 0; this._bindings && i < this._bindings.length; i++) {
                var binding = this._bindings[i];
                if (binding.element) {
                    for (var bindingType in binding) {
                        if (bindingType != 'id' && bindingType != 'events' && bindingType != 'childId' && bindingType != 'element') {
                            if (bindingType === 'text' || bindingType === 'html') {
                                this._updateViewValue(binding, bindingType, binding[bindingType], updateValuesOnly);
                            } else {
                                for (var bindingDest in binding[bindingType]) {
                                    this._updateViewValue(binding, bindingType, binding[bindingType][bindingDest], updateValuesOnly, bindingDest);
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    View.prototype._updateViewValue = function (binding, bindingType, sourcePropertyName, updateValuesOnly, bindingDest) {
        var key = binding.id + bindingType + (bindingDest ? ('.' + bindingDest) : '');
        var lastValue = this._lastValues[key];
        var currentValue = this.getValue(sourcePropertyName);

        if (lastValue != currentValue) {
            this._lastValues[key] = currentValue;

            // TODO: enqueue for renderframe update.
            if (!updateValuesOnly) {
                var el = this.subElements[binding.id];

                console.log('Updating "' + this.id + '" because "' + sourcePropertyName + '" changed to "' + currentValue + '"');

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
    };

    View.prototype.getViewModel = function () {
        return this._viewModel;
    };

    View.prototype.getValue = function (propertyName) {
        var targetObject = this._getPropTarget(propertyName);
        var targetValue = (targetObject && targetObject.target) ? targetObject.target[targetObject.propertyName] : '';

        if (typeof targetValue === 'function') {
            targetValue = this._getValueFromFunction(propertyName);
        }

        return targetValue;
    };

    View.prototype.findValue = function (args) {
        var resource = this.getValue(args.name);

        if (resource === undefined && this.parent) {
            this.parent.findValue(args);
        } else {
            args.val = resource;
        }
    };

    View.prototype.setValue = function (propertyName, propertyValue) {
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
    };

    View.prototype._getPropTarget = function (propertyName) {
        var view = this;
        var viewModel = view.getViewModel();
        var propTarget = viewModel;
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
                propTarget = view ? view.getViewModel() : null;
            } else if (propertyPart === '$root') {
                view = this._getRoot();
                propTarget = view.getViewModel();
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
    };

    View.prototype._getRoot = function () {
        var root = this;

        while (root.parent) {
            root = root.parent;
        }

        return root;
    };

    View.prototype._ce = function (tagName, attributes, binding, children) {
        var element = document.createElement(tagName);
        var i;
        var val;

        for (i = 0; attributes && i < attributes.length; i += 2) {
            element.setAttribute(attributes[i], attributes[i + 1]);
        }

        if (binding) {
            this.subElements[binding.id] = binding.element = element;
            if (binding.childId) {
                this.subElements[binding.childId] = element;
            }

            for (var attrName in binding.attr) {
                val = this.getValue(binding.attr[attrName]);

                if (val) {
                    element.setAttribute(attrName, val);
                }
            }
        }

        // Append children.
        if (children) {
            for (i = 0; i < children.length; i++) {
                element.appendChild(children[i]);
            }
        }

        return element;
    };

    View.prototype._ct = function (val) {
        return document.createTextNode(val);
    };

    View.prototype._bindEvents = function () {
        var _this = this;

        for (var i = 0; i < this._bindings.length; i++) {
            var binding = this._bindings[i];
            var targetElement = binding.element;

            for (var bindingType in binding) {
                if (bindingType != 'id' && bindingType != 'events' && bindingType != 'element') {
                    for (var bindingDest in binding[bindingType]) {
                        var source = binding[bindingType][bindingDest];
                        if (source.indexOf('$parent') > -1) {
                            this._viewModel.setData({
                                '$parent': (this.owner || this.parent).getViewModel()
                            }, false);
                        }
                        if (source.indexOf('$root') > -1) {
                            this._viewModel.setData({
                                '$root': this._getRoot().getViewModel()
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
    };

    View.prototype.toggle = function (propertyName) {
        this.setValue(propertyName, !this.getValue(propertyName));

        return false;
    };

    View.prototype.send = function (sourcePropertyName, destinationPropertyName) {
        this.setValue(destinationPropertyName, this.getValue(sourcePropertyName));
    };
    View._instanceCount = 0;
    return View;
})();

module.exports = View;
