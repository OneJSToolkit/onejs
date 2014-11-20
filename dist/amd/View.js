var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", './BaseView', './BlockProcessor', './EventGroup'], function(require, exports, BaseView, BlockProcessor, EventGroup) {
    var View = (function (_super) {
        __extends(View, _super);
        function View() {
            _super.apply(this, arguments);
            this._lastValues = {};
        }
        View.prototype.onRender = function () {
            if (this._spec) {
                this._root = BlockProcessor.fromSpec(this, this._spec);
                this._root.render();
                this.element = this._root.elements[0];
            } else {
                _super.prototype.onRender.call(this);
            }

            return this.element;
        };

        View.prototype.onPostRender = function () {
            this.onUpdate();
        };

        View.prototype.onActivate = function () {
            if (this._root) {
                this._root.bind();
            }

            _super.prototype.onActivate.call(this);
        };

        View.prototype.onViewModelInitialized = function (viewModel, oldViewModel) {
            if (oldViewModel) {
                this.events.off(oldViewModel);
            }

            this.events.on(viewModel, 'findValue', this.findValue);
        };

        View.prototype.onUpdate = function () {
            if (this._root) {
                this._root.update();
            }
        };

        View.prototype.onDispose = function () {
            if (this._root) {
                this._root.dispose();
                this._root = null;
            }
            _super.prototype.onDispose.call(this);
        };

        View.prototype.getValue = function (propertyName, expandObservables) {
            return this._getValue(propertyName, expandObservables);
        };

        View.prototype._getValue = function (propertyName, expandObservables, scopeSource) {
            var targetObject = this._getPropTarget(propertyName, scopeSource);
            var targetValue = (targetObject && targetObject.target) ? targetObject.target[targetObject.propertyName] : undefined;

            if (targetValue) {
                if (expandObservables && targetValue.isObservable) {
                    targetValue = targetValue.getValue();
                } else if (typeof targetValue === 'function') {
                    targetValue = this._getValueFromFunction(propertyName, undefined, scopeSource);
                }
            }

            return targetValue;
        };

        View.prototype.findValue = function (args) {
            var resource = this.getValue(args.name);
            var continueFind = true;

            if (resource === undefined && this.parent && this.parent['findValue']) {
                this.parent['findValue'](args);
            } else {
                args.val = resource;
                continueFind = false;
            }

            return continueFind;
        };

        View.prototype.setValue = function (propertyName, propertyValue) {
            this._setValue(propertyName, propertyValue);
        };

        View.prototype._setValue = function (propertyName, propertyValue, scopeSource) {
            var targetObject = this._getPropTarget(propertyName, scopeSource);
            var target = targetObject.target;

            // TODO, this is a temp fix, less than ideal. If we set command.isExpanded
            // as the property name, we'd have to do what we have below which is to reach
            // in and set the value on the the target. We shouldn't do this.
            // But viewmodel.setData is shallow, so if we passed in { command: { isExpanded: true }},
            // it would stomp on the existing value as it's a new command object.
            if (target) {
                var targetObjectValue = target[targetObject.propertyName];

                if (targetObjectValue && targetObjectValue.isObservable) {
                    targetObjectValue.setValue(propertyValue);
                } else if (typeof target[targetObject.propertyName] !== 'function') {
                    target[targetObject.propertyName] = propertyValue;

                    if (target.change) {
                        target.change();
                    } else {
                        this.update();
                    }
                }
            }
        };

        View.prototype.toggle = function (propertyName, allowPropogation) {
            this._setValue(propertyName, !this._getValue(propertyName, true, this._activeScope), this._activeScope);

            allowPropogation = allowPropogation || false;

            return allowPropogation;
        };

        View.prototype.raise = function (propertyName, ev) {
            return EventGroup.raise(ev.target, propertyName, null, true);
        };

        View.prototype.send = function (sourcePropertyName, destinationPropertyName) {
            this._setValue(destinationPropertyName, this._getValue(sourcePropertyName, true, this._activeScope), this._activeScope);
        };

        View.prototype._getPropTarget = function (propertyName, scopeSource) {
            // [$scope].prop.prop.func(...)
            // $toggle
            // $member.foo
            if (propertyName[0] == '!') {
                propertyName = propertyName.substr(1);
                debugger;
            }

            var propTarget = this.viewModel;
            var propertyPart;
            var args;
            var viewModel;
            var props = propertyName.match(/([\w]+[\(][!$\w.,\(\)\'\" ]*[\)]|[\w]+)/g);

            // If $ is provided, default the target to 'this'. this allows for sub views to be accessed
            // and helpers as well.
            if (propertyName[0] == '$') {
                if (props[0] == 'parent') {
                    propTarget = this.parent;
                    props.shift();
                } else if (props[0] == 'root') {
                    propTarget = viewModel = this._getRoot().viewModel;
                    props.shift();
                } else if (props[0] == 'owner') {
                    if (this.owner) {
                        propTarget = viewModel = (this.owner).viewModel;
                    }

                    props.shift();
                } else if (props[0] === 'view') {
                    propTarget = this;
                    props.shift();
                } else {
                    propTarget = this.owner || this;
                }
            } else {
                while (scopeSource) {
                    if (scopeSource.scope && scopeSource.scope.hasOwnProperty(props[0])) {
                        propTarget = scopeSource.scope;
                        scopeSource = null;
                    } else {
                        scopeSource = scopeSource.parent;
                    }
                }
            }

            for (var i = 0; propTarget && i < props.length; i++) {
                var prop = props[i];
                var parenIndex = prop.indexOf('(');

                // strip functions.
                if (parenIndex > -1) {
                    args = prop.substr(parenIndex + 1, prop.length - 2 - parenIndex);
                    prop = props[i] = prop.substr(0, parenIndex);
                }

                if (i < (props.length - 1)) {
                    propTarget = propTarget[prop];

                    if (propTarget && propTarget.viewModel) {
                        // this vm should be observed.
                        propTarget = viewModel = propTarget.viewModel;
                    }
                }
            }

            return {
                target: propTarget,
                viewModel: viewModel,
                propertyName: props[props.length - 1],
                args: args
            };
        };

        View.prototype._getRoot = function () {
            var root = this;

            while (root.parent) {
                root = root.parent;
            }

            return root;
        };

        View.prototype._getValueFromFunction = function (target, existingArgs, scopeSource) {
            var propTarget = this._getPropTarget(target, scopeSource);
            var args = [];
            var returnValue = '';

            if (propTarget.args && propTarget.args.length > 0) {
                var providedArgs = propTarget.args.split(/[\s,]+/);

                for (var i = 0; i < providedArgs.length; i++) {
                    var arg = providedArgs[i];

                    // pass in literal or resolved property.
                    if (arg[0] == "'") {
                        args.push(arg.substr(1, arg.length - 2));
                    } else if (arg === 'true' || arg === 'false') {
                        args.push(Boolean(arg));
                    } else if (arg.length > 0 && !isNaN(Number(arg))) {
                        args.push(Number(arg));
                    } else {
                        args.push(this._getValue(providedArgs[i], true, scopeSource));
                    }
                }
            }

            if (existingArgs) {
                if (existingArgs && existingArgs.length == 1 && existingArgs[0].args) {
                    args = args.concat([existingArgs[0].args]);
                } else {
                    args = args.concat(existingArgs);
                }
            }

            var parentObject = propTarget.target;
            var propertyName = propTarget.propertyName;

            if (parentObject && parentObject[propertyName]) {
                this._activeScope = scopeSource;
                returnValue = parentObject[propertyName].apply(parentObject, args);
                this._activeScope = undefined;
            }

            return returnValue;
        };
        return View;
    })(BaseView);

    
    return View;
});
