import BaseView = require('./BaseView');
import Block = require('./Block');
import IBlockSpec = require('./IBlockSpec');
import IScopeObj = require('./IScopeObj');
import IView = require('./IView');
declare class View extends BaseView {
    public owner: any;
    public _lastValues: {};
    public _hasChanged: boolean;
    public _isEvaluatingView: boolean;
    public _spec: IBlockSpec;
    public _root: Block;
    public _activeScope: IScopeObj;
    public onRender(): HTMLElement;
    public onPostRender(): void;
    public onActivate(): void;
    public onViewModelInitialized(viewModel: any, oldViewModel: any): void;
    public onUpdate(): void;
    public onDispose(): void;
    public getValue(propertyName: string, expandObservables?: boolean): any;
    public _getValue(propertyName: string, expandObservables?: boolean, scopeSource?: IScopeObj): any;
    public findValue(args: any): boolean;
    public setValue(propertyName: string, propertyValue: any): void;
    public _setValue(propertyName: string, propertyValue: any, scopeSource?: IScopeObj): void;
    public toggle(propertyName: string, allowPropogation?: boolean): boolean;
    public raise(propertyName: string, ev: any): any;
    public send(sourcePropertyName: any, destinationPropertyName: any): void;
    public _getPropTarget(propertyName: string, scopeSource?: IScopeObj): {
        target: any;
        viewModel: any;
        propertyName: string;
        args: any;
    };
    public _getRoot(): IView;
    public _getValueFromFunction(target: any, existingArgs?: any, scopeSource?: IScopeObj): string;
}
export = View;
