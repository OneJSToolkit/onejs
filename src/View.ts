import ViewModel = require('ViewModel');
import EventGroup = require('EventGroup');
import Encode = require('Encode');

enum ViewState {
    CREATED = 0,
    INACTIVE = 1,
    ACTIVE = 2,
    DISPOSED = 3
}

class View {
    public viewName: string = 'View';
    public baseTag: string = 'div';
    public baseClass: string = '';
    public baseStyle: string = '';
    public viewModelType: any = ViewModel;

    public id: string;

    public element: HTMLElement;
    public parent: View;
    public children: View[];

    public events: EventGroup;

    private static _instanceCount = 0;
    public _bindings;
    private _viewModel: ViewModel;
    private _subElements: HTMLElement[];
    private _hasChanged: boolean;
    private _isEvaluatingView: boolean;
    private _state: number = ViewState.CREATED;
    private _initialData;

    constructor(data ? : any) {
        this.events = new EventGroup(this);
        this.children = [];
        this._initialData = data;
    }

    public dispose(): void {
        if (this._state !== ViewState.DISPOSED) {

            if (this._state == ViewState.ACTIVE) {
                this.deactivate();
            }

            this._state = ViewState.DISPOSED;

            this.children.forEach(function(child) {
                child.dispose();
            });

            this.clearChildren();
            this.events.dispose();
            this._viewModel.dispose();
        }
    }

    public setData(data: any, forceUpdate ? : boolean) {
        if (this._state !== ViewState.DISPOSED) {
            this.initialize();
            this._viewModel.setData(data, forceUpdate);
        }
    }

    public initialize(): void {
        if (this._state === ViewState.CREATED) {
            this.id = this.viewName + '-' + View._instanceCount;
            this._viewModel = new this.viewModelType(this._initialData);
            this._viewModel.onInitialize();
            this._state = ViewState.INACTIVE;
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

            this.children.forEach(function(child) {
                child.activate();
            });

            this.element = document.getElementById(this.id + '_0');
            this.element['control'] = this;
            this._viewModel.onActivate(this._subElements);
        }
    }

    public deactivate(): void {
        if (this._state === ViewState.ACTIVE) {
            this._state = ViewState.INACTIVE;

            this.children.forEach(function(child) {
                child.deactivate();
            });

            this.element['control'] = null;

            this._viewModel.onDeactivate();
        }
    }

    public addChild(view: View): View {
        view.parent = this;
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

    public onRenderHtml(viewModel: any): string {
        return '<div id="' + this.id + '"></div>';
    }

    public  genStyle(defaultStyles: string, styleMap ? : string[]): string {

        defaultStyles = defaultStyles || '';

        var styles = defaultStyles.split(';');
        var viewModel = this._viewModel;

        for (var i = 0; styleMap && i < styleMap.length; i += 2) {
            var styleRule = styleMap[i];
            var source = styleMap[i + 1];

            switch (styleRule) {
                case 'display':
                case 'display.inline-block':
                    styles.push('display: ' + (viewModel[source] ? ((styleRule.indexOf('.') > -1) ? styleRule.split('.').pop() : 'block') : 'none'));
                    break;

                default:
                    if (styleMap[i + 1]) {
                        styles.push(styleMap[i] + ': ' + Encode.toHtmlAttr(viewModel[styleMap[i + 1]]));
                    }
                    break;
            }
        }

        return 'style="' + styles.join('; ') + '"';
    }

    public genClass(defaultClasses: string, classMap ? : string[]): string {
        defaultClasses = defaultClasses || '';

        var classes = defaultClasses.split(' ');

        for (var i = 0; classMap && i < classMap.length; i += 2) {
            if (this[classMap[i + 1]]) {
                classes.push(classMap[i]);
            }
        }

        return 'class="' + classes.join(' ') + '"';
    }

    public genAttr(defaultAttributes: string, attributeMap: string[]): string {
        var attrString = '';
        var attributes = [];

        for (var i = 0; i < attributeMap.length; i += 2) {
            attributes.push(attributeMap[i] + '="' + Encode.toHtmlAttr(this[attributeMap[i + 1]]) + '"');
        }

        return attributes.join(' ');
    }

    public static loadStyles(rules)
    {
        var styleEl = document.createElement('style');

        styleEl.type = "text/css";
        styleEl.appendChild(document.createTextNode(rules));
        document.head.appendChild(styleEl);
    }

    private _bindEvents() {
        for (var i = 0; i < this._bindings.length; i++) {
            var binding = this._bindings[i];

            if (binding.events) {
                for (var eventName in binding.events) {
                    var targetName = binding.events[eventName];
                    var targetElement = document.getElementById(this.id + '_' + binding.id);

                    if (this._viewModel[targetName]) {
                        this.events.on(targetElement, eventName, this._viewModel[targetName]);
                    }
                }
            }
        }
    }
}

export = View;