import Binding = require('./Binding');
import BlockType = require('./BlockType');
import View = require('./View');
import DomUtils = require('./DomUtils');
import IBlockSpec = require('./IBlockSpec');
import IView = require('./IView');
import EventGroup = require('./EventGroup');

class Block {
    parent: Block;
    elements: HTMLElement[];
    template: IBlockSpec[];
    children: Block[] = [];
    view: View;
    placeholder: Comment;
    bindings: Binding[] = [];
    subViews: { name: string; view:IView }[] = [];
    _lastValues: any = {};
    bound = false;
    scope: {[key: string]: any};
    events = new EventGroup(this);

    constructor(view: View, parent: Block) {
        this.view = view;
        this.parent = parent;
    }

    render() {
        if (!this.elements) {
            this.elements = <any>renderNodes(this, this.template);
        }
        this.children.forEach((child) => {
            child.render();
        });
    }

    bind() {
        this.bound = true;
        this._bindEvents();
        this._bindSubviews();

        this.children.forEach((child) => {
            child.bind();
        });
    }

    update() {

        this.bindings.forEach((binding) => {

            for (var bindingType in binding.desc) {
                if (bindingType != 'events') {
                    if (bindingType === 'text' || bindingType === 'html') {
                        this._updateViewValue(binding, bindingType, binding.desc[bindingType]);
                    } else {
                        for (var bindingDest in binding.desc[bindingType]) {
                            if (binding.desc[bindingType].hasOwnProperty(bindingDest)) {
                                this._updateViewValue(binding, bindingType, binding.desc[bindingType][bindingDest], bindingDest);
                            }
                        }
                    }
                }
            }
        });
        
        this.children.forEach((child) => {
            child.update();
        });
    }

    dispose() {
        this.children.forEach((child) => {
            child.dispose();
        });

        this._disposeSubviews();

        this.events.dispose();
    }

    getValue(propertyName: string) {
        return this.view._getValue(propertyName, true, this);
    }

    insertElements(elements: HTMLElement[], refElement: HTMLElement) {
        var index = this.elements.indexOf(refElement);
        if (index >= 0) {
            var spliceArgs: any[] = [index + 1, 0];
            this.elements.splice.apply(this.elements, spliceArgs.concat(elements));
        }
        if (refElement.parentNode) {
            var lastElement = refElement;
            elements.forEach((element) => {
                DomUtils.insertAfter(element, lastElement);
                lastElement = element;
            });
        }
    }

    removeElements(elements: HTMLElement[]) {
        //TODO: can we assume we are always removing contiguous elements?
        var index = this.elements.indexOf(elements[0]);
        if (index >= 0) {
            this.elements.splice(index, elements.length);
        }

        elements.forEach((element) => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }

    _updateViewValue(binding, bindingType, sourcePropertyName, bindingDest?) {
        var key = binding.id + bindingType + (bindingDest ? ('.' + bindingDest) : '');
        var lastValue = this._lastValues[key];
        var currentValue = this.getValue(sourcePropertyName);

        if (lastValue != currentValue) {
            this._lastValues[key] = currentValue;

            var el = binding.element;

            switch (bindingType) {
                case 'text':
                    el.textContent = currentValue;
                    break;

                case 'html':
                    el.innerHTML = currentValue;
                    break;

                case 'css':
                    el.style[bindingDest] = currentValue;
                    break;

                case 'className':
                    DomUtils.toggleClass(el, bindingDest, currentValue);
                    break;

                case 'attr':
                    if (bindingDest === "value" || bindingDest === 'checked') {
                        el[bindingDest] = currentValue;
                    } else if (currentValue) {
                        el.setAttribute(bindingDest, currentValue);
                    } else {
                        el.removeAttribute(bindingDest);
                    }
                    break;
            }
        }
    }

    _bindExternalModel(propName) {
        // We need to observe an external viewmodel, so set it on the current.
        var propTarget = this.view._getPropTarget(propName);

        if (propTarget.viewModel) {
            var data = {};

            data['extern__' + propName.substr(0, propName.indexOf('.'))] = propTarget.viewModel;
            this.view.viewModel.setData(data, false);
        }
    }

    _bindEvents() {
        var _this = this; 

        for (var i = 0; i < _this.bindings.length; i++) {
            var binding = _this.bindings[i];
            var targetElement = binding.element;
            var source;
            var propTarget;

            // Observe parent if bindings reference parent.
            // TODO: This should be moved/removed.
            for (var bindingType in binding.desc) {
                if (bindingType != 'events' && bindingType != 'id') {
                    var bindingSource = binding.desc[bindingType];

                    if (bindingType === 'text' || bindingType === 'html') {
                        this._bindExternalModel(bindingSource);
                    } else {
                        for (var bindingDest in bindingSource) {
                            this._bindExternalModel(bindingSource[bindingDest]);
                        }
                    }
                }
            }

            if (binding.desc.events) {
                for (var eventName in binding.desc.events) {
                    var targetList = binding.desc.events[eventName];

                    _this._bindEvent(targetElement, eventName, targetList);
                }
            }

            _this._bindInputEvent(targetElement, binding);
        }
    }

    _bindInputEvent(element: HTMLElement, binding:Binding) {
        if (binding.desc.attr && (binding.desc.attr['value'] || binding.desc.attr['checked'])) {
            this.events.on(element, 'input,change', () => {
                var source = binding.desc.attr['value'] ? 'value' : 'checked';
                var newValue = element[source];
                var key = binding.id + 'attr.' + source;

                this._lastValues[key] = newValue;
                this.view.setValue(binding.desc.attr[source], newValue);

                return false;
            });
        }
    }

    _bindEvent(element, eventName, targetList) {

        if (eventName.indexOf('$view.') == 0) {
            eventName = eventName.substr(6);
            element = this.view;
        }

        this.events.on(element, eventName, (...args: any[]) => {
            var returnValue;

            for (var targetIndex = 0; targetIndex < targetList.length; targetIndex++) {
                var target = targetList[targetIndex];

                returnValue = this.view._getValueFromFunction(target, args, this);
            }

            return returnValue;
        });
    }

    _bindSubviews() {
        var length = this.subViews.length;
        for (var i = 0; i < length; i++) {
            this.subViews[i].view.activate();
        }
    }

    _disposeSubviews() {
        var length = this.subViews.length;
        for (var i = 0; i < length; i++) {
            var subview = this.subViews[i];
            subview.view.dispose();
            this.view.removeChild(subview.view);
            delete this.scope[subview.name];
        }
    }

    _processBinding(spec: IBlockSpec, element: HTMLElement): HTMLElement {

        if (spec.binding) {
            var binding = new Binding(this.bindings.length.toString(), element, spec.binding);
            this.bindings.push(binding);
        }

        return element;
    }
}

function renderNodes(block:Block, nodes: IBlockSpec[]): Node[]{
    if (nodes) {
        return nodes.map((node:IBlockSpec):Node => {
            if (node.type === BlockType.Element) {
                var children = renderNodes(block, node.children);
                return block._processBinding(node, DomUtils.ce(node.tag, node.attr, children));
            } else if (node.type === BlockType.Text) {
                return DomUtils.ct(node.value);
            } else if (node.type === BlockType.Comment) {
                var c = DomUtils.createComment(node.value);
                if (node.owner) {
                    node.owner.placeholder = c;
                }
                return c;
            } else if (node.type === BlockType.View) {
                var viewRef = block.view[node.name];
                var view: IView;
                if (typeof viewRef === 'function') {
                    view = new viewRef();
                    block.subViews.push({name: node.name, view: view});
                    block.view.addChild(view);
                    block.scope[node.name] = view;
                    if (block.bound) {
                        block._bindSubviews();
                    }
                } else {
                    view = viewRef;
                }
                return block._processBinding(node, view.render());
            }
        });
    }
}

export = Block;