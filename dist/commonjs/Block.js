var Binding = require('./Binding');
var BlockType = require('./BlockType');

var DomUtils = require('./DomUtils');

var EventGroup = require('./EventGroup');

var Block = (function () {
    function Block(view, parent) {
        this.children = [];
        this.bindings = [];
        this._lastValues = {};
        this.events = new EventGroup(this);
        this.view = view;
        this.parent = parent;
    }
    Block.prototype.render = function () {
        if (!this.elements) {
            this.elements = renderNodes(this, this.template);
        }
        this.children.forEach(function (child) {
            child.render();
        });
    };

    Block.prototype.bind = function () {
        this._bindEvents();

        this.children.forEach(function (child) {
            child.bind();
        });
    };

    Block.prototype.update = function () {
        var _this = this;
        this.bindings.forEach(function (binding) {
            for (var bindingType in binding.desc) {
                if (bindingType != 'events') {
                    if (bindingType === 'text' || bindingType === 'html') {
                        _this._updateViewValue(binding, bindingType, binding.desc[bindingType]);
                    } else {
                        for (var bindingDest in binding.desc[bindingType]) {
                            if (binding.desc[bindingType].hasOwnProperty(bindingDest)) {
                                _this._updateViewValue(binding, bindingType, binding.desc[bindingType][bindingDest], bindingDest);
                            }
                        }
                    }
                }
            }
        });

        this.children.forEach(function (child) {
            child.update();
        });
    };

    Block.prototype.dispose = function () {
        this.children.forEach(function (child) {
            child.dispose();
        });

        this.events.dispose();
    };

    Block.prototype.getValue = function (propertyName) {
        return this.view._getValue(propertyName, true, this);
    };

    Block.prototype.insertElements = function (elements, refElement) {
        var index = this.elements.indexOf(refElement);
        if (index >= 0) {
            var spliceArgs = [index + 1, 0];
            this.elements.splice.apply(this.elements, spliceArgs.concat(elements));
        }
        if (refElement.parentNode) {
            var lastElement = refElement;
            elements.forEach(function (element) {
                DomUtils.insertAfter(element, lastElement);
                lastElement = element;
            });
        }
    };

    Block.prototype.removeElements = function (elements) {
        //TODO: can we assume we are always removing contiguous elements?
        var index = this.elements.indexOf(elements[0]);
        if (index >= 0) {
            this.elements.splice(index, elements.length);
        }

        elements.forEach(function (element) {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    };

    Block.prototype._updateViewValue = function (binding, bindingType, sourcePropertyName, bindingDest) {
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
    };

    Block.prototype._bindExternalModel = function (propName) {
        // We need to observe an external viewmodel, so set it on the current.
        var propTarget = this.view._getPropTarget(propName);

        if (propTarget.viewModel) {
            var data = {};

            data['extern__' + propName.substr(0, propName.indexOf('.'))] = propTarget.viewModel;
            this.view.viewModel.setData(data, false);
        }
    };

    Block.prototype._bindEvents = function () {
        var _this = this;

        for (var i = 0; i < _this.bindings.length; i++) {
            var binding = _this.bindings[i];
            var targetElement = binding.element;
            var source;
            var propTarget;

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
    };

    Block.prototype._bindInputEvent = function (element, binding) {
        var _this = this;
        if (binding.desc.attr && (binding.desc.attr['value'] || binding.desc.attr['checked'])) {
            this.events.on(element, 'input,change', function () {
                var source = binding.desc.attr['value'] ? 'value' : 'checked';
                var newValue = element[source];
                var key = binding.id + 'attr.' + source;

                _this._lastValues[key] = newValue;
                _this.view.setValue(binding.desc.attr[source], newValue);

                return false;
            });
        }
    };

    Block.prototype._bindEvent = function (element, eventName, targetList) {
        var _this = this;
        if (eventName.indexOf('$view.') == 0) {
            eventName = eventName.substr(6);
            element = this.view;
        }

        this.events.on(element, eventName, function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            var returnValue;

            for (var targetIndex = 0; targetIndex < targetList.length; targetIndex++) {
                var target = targetList[targetIndex];

                returnValue = _this.view._getValueFromFunction(target, args, _this);
            }

            return returnValue;
        });
    };

    Block.prototype._processBinding = function (spec, element) {
        if (spec.binding) {
            var binding = new Binding(this.bindings.length.toString(), element, spec.binding);
            this.bindings.push(binding);
        }

        return element;
    };
    return Block;
})();

function renderNodes(block, nodes) {
    if (nodes) {
        return nodes.map(function (node) {
            if (node.type === 0 /* Element */) {
                var children = renderNodes(block, node.children);
                return block._processBinding(node, DomUtils.ce(node.tag, node.attr, children));
            } else if (node.type === 1 /* Text */) {
                return DomUtils.ct(node.value);
            } else if (node.type === 2 /* Comment */) {
                var c = DomUtils.createComment(node.value);
                if (node.owner) {
                    node.owner.placeholder = c;
                }
                return c;
            } else if (node.type === 6 /* View */) {
                return block._processBinding(node, block.view[node.name].render());
            }
        });
    }
}

module.exports = Block;
