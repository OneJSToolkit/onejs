interface IView {
    element: HTMLElement;

    viewModel: any;

    parent: IView;
    owner: IView;
    children: IView[];

    render() : HTMLElement;

    activate();
    
    resize();

    update();

    setData(data: any, forceUpdate?: boolean);

    deactivate();

    dispose();
}

export = IView;