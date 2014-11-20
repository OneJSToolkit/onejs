import ViewModel = require('./ViewModel');
import EventGroup = require('./EventGroup');
import IView = require('./IView');
declare class BaseView implements IView {
    public viewName: string;
    public element: HTMLElement;
    public state: number;
    public events: EventGroup;
    public activeEvents: EventGroup;
    public viewModelType: any;
    public viewModel: any;
    public children: IView[];
    public parent: IView;
    public owner: IView;
    public isActive: boolean;
    public isDisposed: boolean;
    public _shouldDisposeViewModel: boolean;
    public onInitialize(): void;
    public onRender(): HTMLElement;
    public onPostRender(): void;
    public onActivate(): void;
    public onViewModelInitialized(viewModel: any, previousViewModel: any): void;
    public onViewModelChanged(viewModel: any, changeArgs?: any): void;
    public onResize(): void;
    public onDeactivate(): void;
    public onDispose(): void;
    public onUpdate(): void;
    public initialize(): void;
    public render(): HTMLElement;
    public update(): void;
    public activate(): void;
    public setViewModel(viewModel: ViewModel): void;
    public setData(data: any, forceUpdate?: boolean): void;
    public deactivate(): void;
    public dispose(): void;
    public resize(): void;
    public addChild(view: IView, owner?: IView, index?: number): IView;
    public removeChild(view: IView): IView;
    public clearChildren(): void;
}
export = BaseView;