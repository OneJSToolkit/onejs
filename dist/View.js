define(["require", "exports", 'ViewModel', 'EventGroup', 'Encode'], function(require, exports, ViewModel, EventGroup, Encode) {
    var ViewState;
    (function (ViewState) {
        ViewState[ViewState["CREATED"] = 0] = "CREATED";
        ViewState[ViewState["INACTIVE"] = 1] = "INACTIVE";
        ViewState[ViewState["ACTIVE"] = 2] = "ACTIVE";
        ViewState[ViewState["DISPOSED"] = 3] = "DISPOSED";
    })(ViewState || (ViewState = {}));

    var View = (function () {
        function View(data) {
            this.viewName = 'View';
            this.baseTag = 'div';
            this.baseClass = '';
            this.baseStyle = '';
            this.viewModelType = ViewModel;
            this._state = 0 /* CREATED */;
            this.events = new EventGroup(this);
            this.children = [];
            this._initialData = data;
        }
        View.prototype.dispose = function () {
            if (this._state !== 3 /* DISPOSED */) {
                if (this._state == 2 /* ACTIVE */) {
                    this.deactivate();
                }

                this._state = 3 /* DISPOSED */;

                this.children.forEach(function (child) {
                    child.dispose();
                });

                this.clearChildren();
                this.events.dispose();
                this._viewModel.dispose();
            }
        };

        View.prototype.setData = function (data, forceUpdate) {
            if (this._state !== 3 /* DISPOSED */) {
                this.initialize();
                this._viewModel.setData(data, forceUpdate);
            }
        };

        View.prototype.initialize = function () {
            if (this._state === 0 /* CREATED */) {
                this.id = this.viewName + '-' + View._instanceCount;
                this._viewModel = new this.viewModelType(this._initialData);
                this._viewModel.onInitialize();
                this._state = 1 /* INACTIVE */;
            }
        };

        View.prototype.renderHtml = function () {
            var html;

            if (this._state !== 3 /* DISPOSED */) {
                this.initialize();
                html = this.onRenderHtml(this._viewModel);
            }

            return html;
        };

        View.prototype.activate = function () {
            if (this._state === 1 /* INACTIVE */) {
                this._state = 2 /* ACTIVE */;

                this._bindEvents();

                this.children.forEach(function (child) {
                    child.activate();
                });

                this.element = document.getElementById(this.id + '_0');
                this.element['control'] = this;
                this._viewModel.onActivate(this._subElements);
            }
        };

        View.prototype.deactivate = function () {
            if (this._state === 2 /* ACTIVE */) {
                this._state = 1 /* INACTIVE */;

                this.children.forEach(function (child) {
                    child.deactivate();
                });

                this.element['control'] = null;

                this._viewModel.onDeactivate();
            }
        };

        View.prototype.addChild = function (view) {
            view.parent = this;
            this.children.push(view);

            return view;
        };

        View.prototype.removeChild = function (view) {
            var childIndex = this.children.indexOf(view);
            var child = this.children[childIndex];

            if (childIndex > -1) {
                this.children.splice(childIndex, 1)[0].parent = null;
            }

            return view;
        };

        View.prototype.clearChildren = function () {
            while (this.children.length > 0) {
                this.removeChild(this.children[0]);
            }
        };

        View.prototype.onRenderHtml = function (viewModel) {
            return '<div id="' + this.id + '"></div>';
        };

        View.genStyle = function (defaultStyles, styleMap) {
            defaultStyles = defaultStyles || '';

            var styles = defaultStyles.split(';');

            for (var i = 0; styleMap && i < styleMap.length; i += 2) {
                styles.push(styleMap[i] + ': ' + Encode.toHtmlAttr(this[styleMap[i + 1]]));
            }

            return 'style="' + styles.join('; ') + '"';
        };

        View.genClass = function (defaultClasses, classMap) {
            defaultClasses = defaultClasses || '';

            var classes = defaultClasses.split(' ');

            for (var i = 0; classMap && i < classMap.length; i += 2) {
                if (this[classMap[i + 1]]) {
                    classes.push(classMap[i]);
                }
            }

            return 'class="' + classes.join(' ') + '"';
        };

        View.genAttr = function (defaultAttributes, attributeMap) {
            var attrString = '';
            var attributes = [];

            for (var i = 0; i < attributeMap.length; i += 2) {
                attributes.push(attributeMap[i] + '="' + Encode.toHtmlAttr(this[attributeMap[i + 1]]) + '"');
            }

            return attributes.join(' ');
        };

        View.prototype._bindEvents = function () {
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
        };
        View._instanceCount = 0;
        return View;
    })();

    
    return View;
});
