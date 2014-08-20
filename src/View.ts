import ViewModel = require('ViewModel');
import EventGroup = require('EventGroup');
import Encode = require('Encode');
import DomUtils = require('DomUtils');

enum ViewState {
    CREATED = 0,
    INACTIVE = 1,
    ACTIVE = 2,
    DISPOSED = 3
}

class View {
    public viewName: string = 'View';
    public viewModelType: any = ViewModel;

    public id: string;
    public element: HTMLElement;
    public parent: View;
    public owner: View; // used in repeater cases where "parent" is repeater, but "owner" is host with repeat blocks.
    public children: View[];
    public events: EventGroup;
    public activeEvents: EventGroup;
    public subElements: any = {};

    _viewModel: ViewModel;
    _inheritedModel: ViewModel;
    _bindings: any[] = [];
    _lastValues = {};
    _hasChanged: boolean;
    _isEvaluatingView: boolean;
    _state: number = ViewState.CREATED;

    static _instanceCount = 0;

    constructor(viewModel? : ViewModel) {
        this.events = new EventGroup(this);
        this.activeEvents = new EventGroup(this);
        this.children = [];
        this._inheritedModel = viewModel;
    }

    public dispose(): void {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].dispose();
        }

        if (this._state !== ViewState.DISPOSED) {

            if (this._state == ViewState.ACTIVE) {
                this.deactivate();
            }

            this._state = ViewState.DISPOSED;

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
        }
    }

    public onInitialize() {}

    public onRenderElement() { this.element = this._ce('div'); }
    public onResize() {}
    public onActivate() {}
    public onDeactivate() {}
    public onViewModelChanged(changeArgs?) {}

    public setData(data: any, forceUpdate ? : boolean) {
        if (this._state !== ViewState.DISPOSED) {
            this.initialize();
            this._viewModel.setData(data, forceUpdate);
        }
    }

    public initialize(): void {
        if (this._state === ViewState.CREATED) {
            this._state = ViewState.INACTIVE;

            this.id = this.viewName + '-' + (View._instanceCount++);

            this._viewModel = this._inheritedModel ? this._inheritedModel : new this.viewModelType();
            this.events.on(this._viewModel, 'change', this.evaluateView);
            this._viewModel.initialize();
            this.onViewModelChanged();
            this.onInitialize();


            for (var i = 0; i < this.children.length; i++) {
                this.children[i].initialize();
            }
        }
    }

    public renderElement(): HTMLElement {

        if (this._state !== ViewState.DISPOSED) {
            this.initialize();
            this.onRenderElement();
            this.updateView();
            this.element['control'] = this;
        }

        return this.element;
    }

    public activate(): void {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].activate();
        }

        if (this._state === ViewState.INACTIVE) {
            this._state = ViewState.ACTIVE;

            this._bindEvents();
            // this.updateView(true);

            this.onActivate();
        }
    }

    public resize() {
        if (this._state === ViewState.ACTIVE) {

            this.onResize();

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].resize();
            }
        }
    }

    public deactivate() {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].deactivate();
        }

        if (this._state === ViewState.ACTIVE) {
            this._state = ViewState.INACTIVE;

            this.onDeactivate();

            this.subElements = null;
            this.activeEvents.off();
        }
    }

    public addChild(view: View, owner ? : View): View {
        view.parent = this;
        view.owner = owner;

        this.children.push(view);

        return view;
    }

    public removeChild(view: View): View {
        var childIndex = this.children.indexOf(view);
        var child = this.children[childIndex];

        if (childIndex > -1) {
            this.children.splice(childIndex, 1)[0].parent = null;
        }

        return view;
    }

    public clearChildren() {
        while (this.children.length > 0) {
            this.removeChild(this.children[0]);
        }
    }

    public evaluateView(changeArgs?) {
        this.onViewModelChanged(changeArgs);
        this.updateView();
    }

    public updateView(updateValuesOnly ? : boolean) {
        if (this._bindings && this.element) {
             for (var i = 0; this._bindings && i < this._bindings.length; i++) {
                var binding = this._bindings[i];

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

    _updateViewValue(binding, bindingType, sourcePropertyName, updateValuesOnly? : boolean, bindingDest?) {
        var key = binding.id + bindingType + (bindingDest ? ('.' + bindingDest) : '');
        var lastValue = this._lastValues[key];
        var currentValue = this.getValue(sourcePropertyName);

        if (lastValue != currentValue) {
            this._lastValues[key] = currentValue;

            // TODO: enqueue for renderframe update.
            if (!updateValuesOnly) {

                var el = this.subElements[binding.id];

                console.log('Updating "' + binding.id + '" because "' + sourcePropertyName + '" changed to "' + currentValue + '"');

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
    }

    public getViewModel(): any {
        return this._viewModel;
    }

    public getValue(propertyName: string): any {
        var targetObject = this._getPropTarget(propertyName);

        propertyName = this._getPropName(propertyName);

        var targetValue = (targetObject && targetObject.target) ? targetObject.target[propertyName] : '';

        if (typeof targetValue === 'function') {
            targetValue = targetValue.call(targetObject.target, this._viewModel, propertyName);
        }

        return targetValue;
    }

    public setValue(propertyName: string, propertyValue: any) {
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

    _getPropName(propertyName) {
        var periodIndex = propertyName.lastIndexOf('.');

        if (periodIndex > -1) {
            propertyName = propertyName.substr(periodIndex + 1);
        }

        return propertyName;
    }

    _getPropTarget(propertyName) {
        var view = this;
        var viewModel = view.getViewModel();
        var propTarget: any = viewModel;
        var periodIndex = propertyName.indexOf('.');
        var propertyPart;

        while (periodIndex > -1 && propTarget) {
            propertyPart = propertyName.substr(0, periodIndex);

            if (propertyPart === '$parent') {
                view = this.parent.owner || this.parent;
                propTarget = view ? view.getViewModel() : null;
            } else if (propertyPart === '$root') {
                view = this._getRoot();
                propTarget = view.getViewModel();
            } else if (propertyPart === '$view') {
                view = this;
                propTarget = this;
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
            propertyName: propertyName
        };
    }

    _getRoot() {
        var root = this;

        while (root.parent) {
            root = root.parent;
        }

        return root;
    }

    _ce(tagName: string, attributes?: string[], binding?: any, children?: any[]) : HTMLElement {
        var element = document.createElement(tagName);
        var i;
        var val;

        // Set default attributes.
        for (i = 0; attributes && i < attributes.length; i += 2) {
            element.setAttribute(attributes[i], attributes[i + 1]);
        }

        if (binding) {
            this.subElements[binding.id] = binding.element = element;
            if (binding.childId) {
                this.subElements[binding.childId] = element;
            }

            // Update bound attributes.
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
    }

    _ct(val:string): Text {
        return document.createTextNode(val);
    }

    _bindEvents() {
        var _this = this;

        for (var i = 0; i < this._bindings.length; i++) {
            var binding = this._bindings[i];
            var targetElement = binding.element;

            // Observe parent if bindings reference parent.
            // TODO: This should be moved/removed.
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
        }    }

    _bindInputEvent(element, binding) {
        if (binding.attr && (binding.attr.value || binding.attr.checked)) {
            this.activeEvents.on(element, 'input,change', function() {
                var source = binding.attr.value ? 'value' : 'checked';
                var newValue = element[source];
                var key = binding.id + 'attr.' + source;

                this._lastValues[key] = newValue;
                this.setValue(binding.attr[source], newValue);
            });
        }
    }

    _bindEvent(element, eventName, targetList) {
        var _this = this;

        this.activeEvents.on(element, eventName, function(ev) {
            for (var targetIndex = 0; targetIndex < targetList.length; targetIndex++) {
                var target = targetList[targetIndex];
                var args = <any>arguments;

                var paramsPosition = target.indexOf('(');

                if (paramsPosition > -1) {
                    var providedArgs = target.substr(paramsPosition + 1, target.length - paramsPosition - 2).split(/[\s,]+/);

                    args = [];
                    for (var i = 0; i < providedArgs.length; i++) {
                        var arg = providedArgs[i];

                        // pass in literal or value.
                        args.push(arg[0] == "'" ? arg.substr(1, arg.length - 2) : this.getValue(providedArgs[i]));
                    }
                    target = target.substr(0, paramsPosition);
                }

                var propTarget = _this._getPropTarget(target);
                var parentObject = propTarget.target;
                var propertyName = propTarget.propertyName;

                if (parentObject && parentObject[propertyName]) {
                    return parentObject[propertyName].apply(parentObject, args);
                }
            }
        });
    }

    toggle(propertyName: string) {
        this.setValue(propertyName, !this.getValue(propertyName));

        return false;
    }

    send(sourcePropertyName, destinationPropertyName) {
        this.setValue(destinationPropertyName, this.getValue(sourcePropertyName));
    }
}

export = View;