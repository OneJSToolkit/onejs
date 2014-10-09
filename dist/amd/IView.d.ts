interface IView {
    element: HTMLElement;
    viewModel: any;
    parent: IView;
    owner: IView;
    children: IView[];
    render(): HTMLElement;
    activate(): any;
    resize(): any;
    update(): any;
    setData(data: any, forceUpdate?: boolean): any;
    deactivate(): any;
    dispose(): any;
}
export = IView;
