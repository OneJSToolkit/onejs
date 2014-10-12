var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
;

(function (BlockType) {
    BlockType[BlockType["Element"] = 0] = "Element";
    BlockType[BlockType["Text"] = 1] = "Text";
    BlockType[BlockType["Comment"] = 2] = "Comment";
    BlockType[BlockType["Block"] = 3] = "Block";
    BlockType[BlockType["IfBlock"] = 4] = "IfBlock";
    BlockType[BlockType["RepeaterBlock"] = 5] = "RepeaterBlock";
})(exports.BlockType || (exports.BlockType = {}));
var BlockType = exports.BlockType;

var Block = (function () {
    function Block(view) {
        this.children = [];
        this.view = view;
    }
    Block.prototype.render = function () {
        if (!this.elements) {
            this.elements = renderNodes(this.template);
        }
        this.children.forEach(function (child) {
            child.render();
        });
    };

    Block.prototype.attach = function () {
        this.children.forEach(function (child) {
            child.attach();
        });
    };

    Block.prototype.detach = function () {
        this.children.forEach(function (child) {
            child.detach();
        });
    };

    Block.prototype.update = function () {
        this.children.forEach(function (child) {
            child.update();
        });
    };

    Block.prototype.dispose = function () {
        this.children.forEach(function (child) {
            child.dispose();
        });
    };
    return Block;
})();
exports.Block = Block;

function renderNodes(nodes) {
    if (nodes) {
        return nodes.map(function (node) {
            var children = renderNodes(node.children);
            if (node.type === 0 /* Element */) {
                return createElement(node.tag, node.attr, children);
            } else if (node.type === 1 /* Text */) {
                return createText(node.value);
            } else if (node.type === 2 /* Comment */) {
                var c = createComment(node.value);
                if (node.owner) {
                    node.owner.placeholder = c;
                }
                return c;
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

        this.source = source;
    }
    IfBlock.prototype.render = function () {
        if (!this.rendered && this.view.getValue(this.source)) {
            _super.prototype.render.call(this);
            this.insert();
            this.rendered = true;
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
            this.detach();
            this.remove();
        }
    };

    IfBlock.prototype.insert = function () {
        var _this = this;
        if (!this.inserted) {
            this.inserted = true;
            this.elements.forEach(function (element) {
                insertAfter(element, _this.placeholder);
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
    if (spec.type === 0 /* Element */ || spec.type === 1 /* Text */) {
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
        } else {
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
