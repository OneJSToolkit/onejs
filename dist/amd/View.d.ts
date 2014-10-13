import BaseView = require('./BaseView');
import IView = require('./IView');
declare class View extends BaseView {
    public owner: any;
    public _bindings: any[];
    public _lastValues: {};
    public _hasChanged: boolean;
    public _isEvaluatingView: boolean;
    public onPostRender(): void;
    public onActivate(): void;
    public onViewModelInitialized(viewModel: any, oldViewModel: any): void;
    public onUpdate(): void;
    public onDispose(): void;
    public getValue(propertyName: string, expandObservables?: boolean): any;
    public findValue(args: any): void;
    public setValue(propertyName: string, propertyValue: any): void;
    public toggle(propertyName: string, allowPropogation?: boolean): boolean;
    public send(sourcePropertyName: any, destinationPropertyName: any): void;
    public _updateViewValue(binding: any, bindingType: any, sourcePropertyName: any, bindingDest?: any): void;
    public _getPropTarget(propertyName: any): {
        target: any;
        viewModel: any;
        propertyName: any;
        args: any;
    };
    public _getRoot(): IView;
    public _bindEvents(): void;
    public _bindInputEvent(element: any, binding: any): void;
    public _bindEvent(element: any, eventName: any, targetList: any): void;
    public _getValueFromFunction(target: any, existingArgs?: any): string;
}
export = View;
