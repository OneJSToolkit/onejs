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
    public parent: View;
    public owner: View;
    public children: View[];
    public events: EventGroup;
    public activeEvents: EventGroup;

    _viewModel: ViewModel;
    _parentViewModel: ViewModel;
    _bindings = [];
    _lastValues = {};
    _subElements: any;
    _hasChanged: boolean;
    _isEvaluatingView: boolean;
    _state: number = ViewState.CREATED;
    _initialData;

    static _instanceCount = 0;

    constructor(data ? : any) {
        this.events = new EventGroup(this);
        this.activeEvents = new EventGroup(this);
        this.children = [];
        this._initialData = data;
    }

    public dispose(): void {
        if (this._state !== ViewState.DISPOSED) {

            if (this._state == ViewState.ACTIVE) {
                this.deactivate();
            }

            this._state = ViewState.DISPOSED;

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].dispose();
            }

            this.clearChildren();
            this.events.dispose();
            this.activeEvents.dispose();
            this._viewModel.dispose();
        }
    }

    public onInitialize() {}
    public onRenderHtml(viewModel: any): string {
        return '';
    }
    public onActivate() {}
    public onDeactivate() {}
    public onViewModelChanged() {}

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

            this._viewModel = new this.viewModelType(this._initialData);
            this.events.on(this._viewModel, 'change', this.evaluateView);
            this._viewModel.onInitialize();
            this.onViewModelChanged();
            this.onInitialize();


            for (var i = 0; i < this.children.length; i++) {
                this.children[i].initialize();
            }
        }
    }

    public renderHtml(): string {
        var html;


        if (this._state !== ViewState.DISPOSED) {
            this.initialize();

            html = this.onRenderHtml(this._viewModel);
        }

        return html;
    }

    public activate(): void {
        if (this._state === ViewState.INACTIVE) {
            this._state = ViewState.ACTIVE;

            this._bindEvents();
            this._findElements();
            this.updateView(true);

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].activate();
            }

            this.onActivate();
        }
    }

    public deactivate(): void {
        if (this._state === ViewState.ACTIVE) {
            this._state = ViewState.INACTIVE;

            this.onDeactivate();

            this._subElements = null;
            this.activeEvents.off();

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].deactivate();
            }
        }
    }

    public addChild(view: View, owner?: View): View {
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

    public evaluateView() {
        this.onViewModelChanged();
        this.updateView();
    }

    public updateView(updateValuesOnly ? : boolean) {
        if (this._state === ViewState.ACTIVE) {


            for (var i = 0; this._bindings && i < this._bindings.length; i++) {
                var binding = this._bindings[i];

                for (var bindingType in binding) {
                    if (bindingType != 'id' && bindingType != 'events' && bindingType != 'childId' && bindingType != 'text' && bindingType != 'html') {
                        for (var bindingDest in binding[bindingType]) {
                            var sourcePropertyName = binding[bindingType][bindingDest];
                            var key = binding.id + bindingType + '.' + bindingDest;
                            var lastValue = this._lastValues[key];
                            var currentValue = this.getValue(sourcePropertyName);

                            if (lastValue != currentValue) {
                                var el = this._subElements[binding.id];
                                this._lastValues[key] = currentValue;

                                if (!updateValuesOnly) {
                                    console.log(this.viewName + ' updateView' + this.id);

                                    if (bindingType == 'className') {
                                        DomUtils.toggleClass(el, bindingDest, currentValue);
                                    } else if (bindingType == 'attr') {
                                        if (currentValue) {
                                            el.setAttribute(bindingDest, currentValue);
                                        } else {
                                            el.removeAttribute(bindingDest);
                                        }
                                    }
                                }
                            }
                        }
                    }
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
        var targetViewModel = targetObject.view.getViewModel();

        // TODO, this is a temp fix, less than ideal. If we set command.isExpanded
        // as the property name, we'd have to do what we have below which is to reach
        // in and set the value on the the target. We shouldn't do this.
        // But viewmodel.setData is shallow, so if we passed in { command: { isExpanded: true }},
        // it would stomp on the existing value as it's a new command object.

        if (targetViewModel) {
            targetObject.target[this._getPropName(propertyName)] = propertyValue;
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
        var propTarget: any = view.getViewModel();
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
            } else {
                propTarget = propTarget[propertyPart];
            }
            propertyName = propertyName.substr(periodIndex + 1);
            periodIndex = propertyName.indexOf('.');
        }

        return {
            originView: this,
            view: view,
            target: propTarget
        };
    }

    _getRoot() {
        var root = this;

        while (root.parent) {
            root = root.parent;
        }

        return root;
    }

    _genStyle(defaultStyles: string, styleMap ? : string[]): string {

        defaultStyles = defaultStyles || '';

        var styles = defaultStyles.split(';');
        var viewModel = this._viewModel;

        for (var i = 0; styleMap && i < styleMap.length; i += 2) {
            var styleRule = styleMap[i];
            var source = styleMap[i + 1];

            switch (styleRule) {
                case 'display':
                case 'display.inline-block':
                    styles.push('display: ' + (this.getValue(source) ? ((styleRule.indexOf('.') > -1) ? styleRule.split('.').pop() : 'block') : 'none'));
                    break;

                default:
                    if (styleMap[i + 1]) {
                        styles.push(styleMap[i] + ': ' + Encode.toHtmlAttr(this.getValue(styleMap[i + 1])));
                    }
                    break;
            }
        }

        return 'style="' + styles.join('; ') + '"';
    }

    _genClass(defaultClasses: string, classMap ? : string[]): string {
        defaultClasses = defaultClasses || '';

        var classes = defaultClasses ? defaultClasses.split(' ') : [];

        for (var i = 0; classMap && i < classMap.length; i += 2) {
            if (this.getValue(classMap[i + 1])) {
                classes.push(classMap[i]);
            }
        }

        return classes.length ? ('class="' + classes.join(' ') + '"') : '';
    }

    _genAttr(defaultAttributes: string, attributeMap: string[]): string {
        var attrString = '';
        var attributes = [];

        for (var i = 0; i < attributeMap.length; i += 2) {
            var val = this.getValue(attributeMap[i + 1]);
            if (val) {
                attributes.push(attributeMap[i] + '="' + Encode.toHtmlAttr(val) + '"');
            }
        }

        return attributes.join(' ');
    }

    _genText(propertyName) {
        return Encode.toJS(this.getValue(propertyName));
    }

    _genHtml(propertyName) {
        return Encode.toHtml(this.getValue(propertyName));
    }

    _bindEvents() {
        for (var i = 0; i < this._bindings.length; i++) {
            var binding = this._bindings[i];

            // Observe parent if bindings reference parent.
            for (var bindingType in binding) {
                if (bindingType != 'id' && bindingType != 'events') {
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
                    var targetElement = document.getElementById(this.id + '_' + binding.id);

                    for (var targetIndex = 0; targetIndex < targetList.length; targetIndex++) {
                        var target = targetList[targetIndex];

                        if (target[0] == '$') {
                            this._bindUtil(targetElement, eventName, target.substr(1));
                        } else {
                            var sourceMethod = this._viewModel[target];

                            if (sourceMethod) {
                                this.activeEvents.on(targetElement, eventName, sourceMethod);
                            }
                        }
                    }
                }
            }
        }
    }

    _bindUtil(element, eventName, util) {
        var _this = this;
        var paramIndex = util.indexOf('(');
        var utilName = util.substr(0, paramIndex);
        var params = util.substr(paramIndex + 1, util.length - paramIndex - 2).split(/[\s,]+/);
        var method = _this['_' + utilName];

        if (method) {
            _this.events.on(element, eventName, function() {
                return method.apply(_this, params);
            });
        }
    }

    _toggle(propertyName: string) {
        this.setValue(propertyName, !this.getValue(propertyName));

        return false;
    }

    _send(sourcePropertyName, destinationPropertyName) {
        this.setValue(destinationPropertyName, this.getValue(sourcePropertyName));
    }

    _bubble(eventName: string, propertyName ? : string) {
        var propertyValue = propertyName ? this.getValue(propertyName) : this.getViewModel();

        return this.events.raise(eventName, propertyValue, true);
    }

    _findElements() {
        this._subElements = {};

        for (var i = 0; i < this._bindings.length; i++) {
            var binding = this._bindings[i];
            var element = document.getElementById(this.id + '_' + binding.id);

            this._subElements[binding.id] = element;
            if (binding.childId) {
                this._subElements[binding.childId] = element;
            }
        }
    }

    loadStyles = DomUtils.loadStyles;
}

export = View;