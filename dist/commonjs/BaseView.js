var ViewModel = require('./ViewModel');
var EventGroup = require('./EventGroup');

var ViewState;
(function (ViewState) {
    ViewState[ViewState["CREATED"] = 0] = "CREATED";
    ViewState[ViewState["INACTIVE"] = 1] = "INACTIVE";
    ViewState[ViewState["ACTIVE"] = 2] = "ACTIVE";
    ViewState[ViewState["DISPOSED"] = 3] = "DISPOSED";
})(ViewState || (ViewState = {}));

var BaseView = (function () {
    function BaseView() {
        this.viewName = 'BaseView';
        this.state = 0 /* CREATED */;
        this.events = new EventGroup(this);
        this.activeEvents = new EventGroup(this);
        this.viewModelType = ViewModel;
        this.children = [];
        this._shouldDisposeViewModel = false;
    }
    // All reactive overridable methods. Each of these will occur.
    BaseView.prototype.onInitialize = function () {
    };

    BaseView.prototype.onRender = function () {
        return this.element;
    };

    BaseView.prototype.onPostRender = function () {
    };

    BaseView.prototype.onActivate = function () {
    };

    BaseView.prototype.onViewModelInitialized = function (viewModel, previousViewModel) {
    };

    BaseView.prototype.onViewModelChanged = function (viewModel, changeArgs) {
        this.update();
    };

    BaseView.prototype.onResize = function () {
    };

    BaseView.prototype.onDeactivate = function () {
    };

    BaseView.prototype.onDispose = function () {
    };

    BaseView.prototype.onUpdate = function () {
    };

    // Standard verb methods on every view.
    BaseView.prototype.initialize = function () {
        if (this.state == 0 /* CREATED */) {
            this.state = 1 /* INACTIVE */;

            if (!this.viewModel) {
                this._shouldDisposeViewModel = true;
                this.setViewModel(new this.viewModelType());
                this.viewModel.initialize();
            }

            this.onInitialize();
        }
    };

    BaseView.prototype.render = function () {
        if (this.state !== 3 /* DISPOSED */) {
            if (this.state === 0 /* CREATED */) {
                this.initialize();
            }

            this.onRender();
            this.onPostRender();
        }

        return this.element;
    };

    BaseView.prototype.update = function () {
        this.onUpdate();
    };

    BaseView.prototype.activate = function () {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].activate();
        }

        if (this.state === 1 /* INACTIVE */) {
            this.state = 2 /* ACTIVE */;

            this.onActivate();
        }
    };

    BaseView.prototype.setViewModel = function (viewModel) {
        var _this = this;
        var events = this.events;

        if (viewModel != this.viewModel) {
            var oldViewModel = this.viewModel;
            if (this.viewModel) {
                this.events.off(this.viewModel);
                this._shouldDisposeViewModel = false;
            }

            this.viewModel = viewModel;

            if (viewModel) {
                this.events.on(viewModel, 'change', function (args) {
                    _this.onViewModelChanged(viewModel, args);
                });
                this.onViewModelChanged(viewModel);
            }

            this.onViewModelInitialized(viewModel, oldViewModel);
        }
    };

    BaseView.prototype.setData = function (data, forceUpdate) {
        if (this.state !== 3 /* DISPOSED */) {
            this.initialize();
            this.viewModel.setData(data, forceUpdate);
        }
    };

    BaseView.prototype.deactivate = function () {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].deactivate();
        }

        if (this.state === 2 /* ACTIVE */) {
            this.state = 1 /* INACTIVE */;

            this.activeEvents.off();

            this.onDeactivate();
        }
    };

    BaseView.prototype.dispose = function () {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].dispose();
        }

        if (this.state !== 3 /* DISPOSED */) {
            if (this.state == 2 /* ACTIVE */) {
                this.deactivate();
            }

            this.state = 3 /* DISPOSED */;

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
    };

    BaseView.prototype.resize = function () {
        if (this.state === 2 /* ACTIVE */) {
            this.onResize();

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].resize();
            }
        }
    };

    BaseView.prototype.addChild = function (view, owner, index) {
        view.parent = this;
        view.owner = owner;

        if (index !== undefined) {
            this.children.splice(index, 0, view);
        } else {
            this.children.push(view);
        }

        return view;
    };

    BaseView.prototype.removeChild = function (view) {
        var childIndex = this.children.indexOf(view);

        if (childIndex > -1) {
            this.children.splice(childIndex, 1)[0].parent = null;
        }

        return view;
    };

    BaseView.prototype.clearChildren = function () {
        while (this.children.length) {
            this.children.pop().parent = null;
        }
    };
    return BaseView;
})();

module.exports = BaseView;
