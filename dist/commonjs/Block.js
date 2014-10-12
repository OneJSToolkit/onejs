var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var DomUtils = require('./DomUtils');

;

(function (BlockType) {
    BlockType[BlockType["Element"] = 0] = "Element";
    BlockType[BlockType["Text"] = 1] = "Text";
    BlockType[BlockType["Comment"] = 2] = "Comment";
    BlockType[BlockType["Block"] = 3] = "Block";
    BlockType[BlockType["IfBlock"] = 4] = "IfBlock";
    BlockType[BlockType["RepeaterBlock"] = 5] = "RepeaterBlock";
    BlockType[BlockType["View"] = 6] = "View";
})(exports.BlockType || (exports.BlockType = {}));
var BlockType = exports.BlockType;

var Block = (function () {
    function Block(view) {
        this.children = [];
        this.bindings = [];
        this._lastValues = {};
        this.view = view;
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
            for (var bindingType in binding) {
                if (bindingType != 'id' && bindingType != 'events' && bindingType != 'element') {
                    if (bindingType === 'text' || bindingType === 'html') {
                        _this._updateViewValue(binding, bindingType, binding[bindingType]);
                    } else {
                        for (var bindingDest in binding[bindingType]) {
                            _this._updateViewValue(binding, bindingType, binding[bindingType][bindingDest], bindingDest);
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
    };

    Block.prototype._updateViewValue = function (binding, bindingType, sourcePropertyName, bindingDest) {
        var key = binding.id + bindingType + (bindingDest ? ('.' + bindingDest) : '');
        var lastValue = this._lastValues[key];
        var currentValue = this.view.getValue(sourcePropertyName);

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

    Block.prototype._bindEvents = function () {
        var _this = this;
        this.bindings.forEach(function (binding) {
            var targetElement = binding.element;

            for (var bindingType in binding) {
                if (bindingType != 'id' && bindingType != 'events' && bindingType != 'element') {
                    for (var bindingDest in binding[bindingType]) {
                        var source = binding[bindingType][bindingDest];
                        if (source.indexOf('$parent') > -1) {
                            _this.view.viewModel.setData({
                                '$parent': (_this.view.owner || _this.view.parent).viewModel
                            }, false);
                        }
                        if (source.indexOf('$root') > -1) {
                            _this.view.viewModel.setData({
                                '$root': _this.view._getRoot().viewModel
                            }, false);
                        }
                    }
                }
            }

            if (binding.events) {
                for (var eventName in binding.events) {
                    var targetList = binding.events[eventName];

                    _this._bindEvent(targetElement, eventName, targetList);
                }
            }

            _this._bindInputEvent(targetElement, binding);
        });
    };

    Block.prototype._bindInputEvent = function (element, binding) {
        if (binding.attr && (binding.attr.value || binding.attr.checked)) {
            this.view.activeEvents.on(element, 'input,change', function () {
                var source = binding.attr.value ? 'value' : 'checked';
                var newValue = element[source];
                var key = binding.id + 'attr.' + source;

                this._lastValues[key] = newValue;
                this.setValue(binding.attr[source], newValue);

                return false;
            });
        }
    };

    Block.prototype._bindEvent = function (element, eventName, targetList) {
        var _this = this;

        if (eventName.indexOf('$view.') == 0) {
            eventName = eventName.substr(6);
            element = this;
        }

        this.view.activeEvents.on(element, eventName, function (ev) {
            var returnValue;

            for (var targetIndex = 0; targetIndex < targetList.length; targetIndex++) {
                var target = targetList[targetIndex];
                var args = arguments;

                returnValue = this._getValueFromFunction(target, args);
            }

            return returnValue;
        });
    };

    Block.prototype._processBinding = function (spec, element) {
        if (spec.binding) {
            spec.binding.id = this.bindings.length.toString();
            spec.binding.element = element;
            this.bindings.push(spec.binding);
        }

        return element;
    };
    return Block;
})();
exports.Block = Block;

function renderNodes(block, nodes) {
    if (nodes) {
        return nodes.map(function (node) {
            if (node.type === 0 /* Element */) {
                var children = renderNodes(block, node.children);
                return block._processBinding(node, createElement(node.tag, node.attr, children));
            } else if (node.type === 1 /* Text */) {
                return createText(node.value);
            } else if (node.type === 2 /* Comment */) {
                var c = createComment(node.value);
                if (node.owner) {
                    node.owner.placeholder = c;
                }
                return c;
            } else if (node.type === 6 /* View */) {
                return block.view[node.name].render();
            }
        });
    }
}

var IfBlock = (function (_super) {
    __extends(IfBlock, _super);
    function IfBlock(view, source) {
        _super.call(this, view);
        this.inserted = false;
        this.rendered = false;
        this.bindCalled = false;

        this.source = source;
    }
    IfBlock.prototype.render = function () {
        if (!this.rendered && this.view.getValue(this.source)) {
            _super.prototype.render.call(this);
            this.insert();
            this.rendered = true;
            if (this.bindCalled) {
                _super.prototype.bind.call(this);
            }
        }
    };

    IfBlock.prototype.bind = function () {
        this.bindCalled = true;
        if (this.rendered) {
            _super.prototype.bind.call(this);
        }
    };

    IfBlock.prototype.update = function () {
        var condition = this.view.getValue(this.source);

        if (condition && !this.inserted) {
            if (this.rendered) {
                this.insert();
            } else {
                this.render();
            }
        } else if (!condition && this.inserted) {
            this.remove();
        }

        if (condition) {
            _super.prototype.update.call(this);
        }
    };

    IfBlock.prototype.insert = function () {
        if (!this.inserted) {
            this.inserted = true;
            var lastElement = this.placeholder;
            this.elements.forEach(function (element) {
                insertAfter(element, lastElement);
                lastElement = element;
            });
        }
    };

    IfBlock.prototype.remove = function () {
        if (this.inserted) {
            this.inserted = false;
            this.elements.forEach(function (element) {
                element.parentNode.removeChild(element);
            });
        }
    };
    return IfBlock;
})(Block);
exports.IfBlock = IfBlock;

function insertAfter(newChild, sibling) {
    var parent = sibling.parentNode;
    var next = sibling.nextSibling;
    if (next) {
        // IE does not like undefined for refChild
        parent.insertBefore(newChild, next);
    } else {
        parent.appendChild(newChild);
    }
}

var RepeaterBlock = (function (_super) {
    __extends(RepeaterBlock, _super);
    function RepeaterBlock(view, source, iterator) {
        _super.call(this, view);
    }
    return RepeaterBlock;
})(Block);
exports.RepeaterBlock = RepeaterBlock;

function fromSpec(view, spec) {
    var block;
    if (spec.type === 0 /* Element */ || spec.type === 1 /* Text */ || spec.type === 6 /* View */) {
        block = new Block(view);
        block.template = processTemplate(block, [spec]);
    } else {
        block = createBlock(view, spec);
        block.template = processTemplate(block, spec.children);
    }

    return block;
}
exports.fromSpec = fromSpec;

function createBlock(view, spec) {
    var block;
    switch (spec.type) {
        case 3 /* Block */:
            block = new Block(view);
            break;
        case 4 /* IfBlock */:
            block = new IfBlock(view, spec.source);
            break;
        case 5 /* RepeaterBlock */:
            block = new RepeaterBlock(view, spec.source, spec.iterator);
            break;
    }

    return block;
}

function processTemplate(parent, template) {
    return template.map(function (spec) {
        if (spec.type === 0 /* Element */ || spec.type === 1 /* Text */) {
            if (spec.children) {
                spec.children = processTemplate(parent, spec.children);
            }
        } else if (spec.type !== 6 /* View */) {
            var block = createBlock(parent.view, spec);
            block.template = processTemplate(block, spec.children);
            parent.children.push(block);
            spec = {
                type: 2 /* Comment */,
                owner: block,
                value: 'block'
            };
        }
        return spec;
    });
}

function createElement(tagName, attributes, children) {
    var el = document.createElement(tagName);

    if (attributes) {
        Object.keys(attributes).forEach(function (attribute) {
            el.setAttribute(attribute, attributes[attribute]);
        });
    }

    if (children) {
        children.forEach(function (child) {
            el.appendChild(child);
        });
    }

    return el;
}

function createText(value) {
    return document.createTextNode(value);
}

function createComment(value) {
    return document.createComment(value);
}
