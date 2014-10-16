import BaseView = require('./BaseView');
import ViewModel = require('./ViewModel');
import EventGroup = require('./EventGroup');
import DomUtils = require('./DomUtils');
import IView = require('./IView');
import Block = require('./Block');

class View extends BaseView {
    owner;

    _lastValues = {};

    _hasChanged: boolean;
    _isEvaluatingView: boolean;
    _spec: Block.IBlockSpec;
    _root: Block.Block;

    onRender(): HTMLElement {
        this._root = Block.fromSpec(this, this._spec);
        this._root.render();
        this.element = this._root.elements[0];
        return this.element;
    }

    onPostRender() {
        this.onUpdate();
    }

    onActivate(): void {
        this._root.bind();
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
        var targetObject = this._getPropTarget(propertyName);
        var targetValue = (targetObject && targetObject.target) ? targetObject.target[targetObject.propertyName] : '';

        if (targetValue) {
            if (expandObservables && targetValue.isObservable) {
                targetValue = targetValue.getValue();
            }
            else if (typeof targetValue === 'function') {
                targetValue = this._getValueFromFunction(propertyName);
            }
        }

        return targetValue;
    }

    findValue(args) {
        var resource = this.getValue(args.name);

        if (resource === undefined && this.parent && this.parent['findValue']) {
            this.parent['findValue'](args);
        } else {
            args.val = resource;
        }
    }

    setValue(propertyName: string, propertyValue: any) {
        var targetObject = this._getPropTarget(propertyName);
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
            }
            else if (typeof target[targetObject.propertyName] !== 'function') {
                target[targetObject.propertyName] = propertyValue;

                if (target.change) {
                    target.change();
                }
                else {
                    this.update();
                }
            }            
        }
    }

    toggle(propertyName: string, allowPropogation ? : boolean) {
        this.setValue(propertyName, !this.getValue(propertyName, true));

        allowPropogation = allowPropogation || false;

        return allowPropogation;
    }

    send(sourcePropertyName, destinationPropertyName) {
        this.setValue(destinationPropertyName, this.getValue(sourcePropertyName, true));
    }

    _getPropTarget(propertyName) {
        // [$scope].prop.prop.func(...)
        // $toggle
        // $member.foo

        var propTarget: any = this.viewModel;
        var propertyPart;
        var args;
        var viewModel;
        var props = propertyName.match(/([\w]+[\(][\w.,\(\)\'\" ]*[\)]|[\w]+)/g);

        // If $ is provided, default the target to 'this'. this allows for sub views to be accessed
        // and helpers as well.
        if (propertyName[0] == '$') {
            propTarget = this.owner || this;

            if (props[0] == 'owner') {
                propTarget = this.owner || this;
                props.shift();
            }
            else {
                propTarget = this;
                
                if (props[0] == 'view') {
                    props.shift();
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

    _getValueFromFunction(target, existingArgs ? ) {
        var propTarget = this._getPropTarget(target);
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
                    args.push(this.getValue(providedArgs[i], true));
                }
            }
        }

        if (args.length == 0 && existingArgs) {
            args = existingArgs;
        }

        var parentObject = propTarget.target;
        var propertyName = propTarget.propertyName;

        if (parentObject && parentObject[propertyName]) {
            returnValue = parentObject[propertyName].apply(parentObject, args);
        }

        return returnValue;
    }
}

export = View;
