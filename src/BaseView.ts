import ViewModel = require('./ViewModel');
import EventGroup = require('./EventGroup');
import IView = require('./IView');

enum ViewState {
    CREATED = 0,
    INACTIVE = 1,
    ACTIVE = 2,
    DISPOSED = 3
}

class BaseView implements IView {
    viewName: string = 'BaseView';
    element: HTMLElement;
    state: number = ViewState.CREATED;

    events = new EventGroup(this);
    activeEvents = new EventGroup(this);

    viewModelType: any = ViewModel;
    viewModel: any;

    children: IView[] = [];
    parent: IView;
    owner: IView;

    _shouldDisposeViewModel = false;

    // All reactive overridable methods. Each of these will occur.
    
    onInitialize() {}

    onRender(): HTMLElement {
        return this.element;
    }

    onPostRender() {}

    onActivate() {}

    onViewModelInitialized(viewModel, previousViewModel) {}

    onViewModelChanged(viewModel, changeArgs? : any): void {
        this.update();
    }

    onResize() {}

    onDeactivate() {}

    onDispose() {}

    onUpdate() {}

    // Standard verb methods on every view.

    initialize() {
        if (this.state == ViewState.CREATED) {
            this.state = ViewState.INACTIVE;

            if (!this.viewModel) {
                this._shouldDisposeViewModel = true;
                this.setViewModel(new this.viewModelType());
                this.viewModel.initialize();
            }

            this.onInitialize();
        }
    }

    render(): HTMLElement {

        if (this.state !== ViewState.DISPOSED) {

            if (this.state === ViewState.CREATED) {
                this.initialize();
            }

            this.onRender();
            this.onPostRender();
        }

        return this.element;
    }

    update() {
        this.onUpdate();
    }

    activate(): void {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].activate();
        }

        if (this.state === ViewState.INACTIVE) {
            this.state = ViewState.ACTIVE;

            this.onActivate();
        }
    }

    setViewModel(viewModel: ViewModel) {
        var events = this.events;

        if (viewModel != this.viewModel) {
            var oldViewModel = this.viewModel;
            if (this.viewModel) {
                this.events.off(this.viewModel);
                this._shouldDisposeViewModel = false;
            }

            this.viewModel = viewModel;

            if (viewModel) {                
                this.events.on(viewModel, 'change', (args) => {
                    this.onViewModelChanged(viewModel, args);
                });
                this.onViewModelChanged(viewModel);
            }

            this.onViewModelInitialized(viewModel, oldViewModel);
        }
    }

    setData(data: any, forceUpdate ? : boolean) {
        if (this.state !== ViewState.DISPOSED) {
            this.initialize();
            this.viewModel.setData(data, forceUpdate);
        }
    }

    deactivate() {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].deactivate();
        }

        if (this.state === ViewState.ACTIVE) {
            this.state = ViewState.INACTIVE;

            this.activeEvents.off();

            this.onDeactivate();
        }
    }
    
    dispose(): void {
        // Children dispose first.
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].dispose();
        }

        if (this.state !== ViewState.DISPOSED) {
            if (this.state == ViewState.ACTIVE) {
                this.deactivate();
            }

            this.state = ViewState.DISPOSED;

            this.onDispose();

            this.clearChildren();
            
            this.events.dispose();
            this.activeEvents.dispose();

            if (!this._shouldDisposeViewModel && this.viewModel) {
                this.viewModel.dispose();
                this.viewModel = null;
            }

            if (this.element) {
                this.element['control'] = null;
                this.element = null;
            }
        }
    }

    resize() {
        if (this.state === ViewState.ACTIVE) {

            this.onResize();

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].resize();
            }
        }
    }

    addChild(view: IView, owner ? : IView, index ? : number): IView {
        view.parent = this;
        view.owner = owner;
        
        if (index !== undefined) {
            this.children.splice(index, 0, view);
        } else {
            this.children.push(view);
        }

        return view;
    }

    removeChild(view: IView): IView {
        var childIndex = this.children.indexOf(view);

        if (childIndex > -1) {
            this.children.splice(childIndex, 1)[0].parent = null;
        }

        return view;
    }

    clearChildren() {
        while (this.children.length) {
            this.children.pop().parent = null;
        }
    }
}

export = BaseView;