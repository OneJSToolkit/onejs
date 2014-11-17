import BaseView = require('./BaseView');
import Block = require('./Block');
import BlockProcessor = require('./BlockProcessor');
import DomUtils = require('./DomUtils');
import EventGroup = require('./EventGroup');
import IBlockSpec = require('./IBlockSpec');
import IScopeObj = require('./IScopeObj');
import IView = require('./IView');
import ViewModel = require('./ViewModel');


class View extends BaseView {
    owner;

    _lastValues = {};

    _hasChanged: boolean;
    _isEvaluatingView: boolean;
    _spec: IBlockSpec;
    _root: Block;
    _activeScope: IScopeObj;

    onRender(): HTMLElement {
        if (this._spec) {
            this._root = BlockProcessor.fromSpec(this, this._spec);
            this._root.render();
            this.element = this._root.elements[0];
        } else {
            super.onRender();
        }

        return this.element;
    }

    onPostRender() {
        this.onUpdate();
    }

    onActivate(): void {
        if (this._root) {
            this._root.bind();
        }

        super.onActivate();
    }

    onViewModelInitialized(viewModel, oldViewModel) {
        if (oldViewModel) {
            this.events.off(oldViewModel);
        }

        this.events.on(viewModel, 'findValue', this.findValue);
    }

    onUpdate() {
        if (this._root) {
            this._root.update();
        }
    }

    onDispose(): void {
        if (this._root) {
            this._root.dispose();
            this._root = null;
        }
        super.onDispose();
    }

    getValue(propertyName: string, expandObservables?: boolean): any {
        return this._getValue(propertyName, expandObservables);
    }

    _getValue(propertyName: string, expandObservables?: boolean, scopeSource?: IScopeObj): any {

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
    }

    findValue(args) {
        var resource = this.getValue(args.name);
        var continueFind = true;

        if (resource === undefined && this.parent && this.parent['findValue']) {
            this.parent['findValue'](args);
        } else {
            args.val = resource;
            continueFind = false;
        }

        return continueFind;
    }

    setValue(propertyName: string, propertyValue: any) {
        this._setValue(propertyName, propertyValue);
    }

    _setValue(propertyName: string, propertyValue: any, scopeSource?: IScopeObj) {
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
    }

    toggle(propertyName: string, allowPropogation?: boolean) {
        this._setValue(propertyName, !this._getValue(propertyName, true, this._activeScope), this._activeScope);

        allowPropogation = allowPropogation || false;

        return allowPropogation;
    }

    send(sourcePropertyName, destinationPropertyName) {
        this._setValue(destinationPropertyName, this._getValue(sourcePropertyName, true, this._activeScope), this._activeScope);
    }

    _getPropTarget(propertyName: string, scopeSource?: IScopeObj) {
        // [$scope].prop.prop.func(...)
        // $toggle
        // $member.foo

        if (propertyName[0] == '!') {
            propertyName = propertyName.substr(1);
            debugger;
        }

        var propTarget: any = this.viewModel;
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
    }

    _getRoot(): IView {
        var root: IView = this;

        while (root.parent) {
            root = root.parent;
        }

        return root;
    }

    _getValueFromFunction(target, existingArgs?, scopeSource?: IScopeObj) {
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
    }
}

export = View;