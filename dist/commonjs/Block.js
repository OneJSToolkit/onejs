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
    function Block() {
        this.elements = [];
        this.children = [];
    }
    Block.prototype.render = function () {
        this.elements = renderNodes(this.template);
    };
    Block.prototype.attach = function () {
    };
    Block.prototype.detach = function () {
    };
    Block.prototype.update = function () {
    };
    Block.prototype.dispose = function () {
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
    function IfBlock(source) {
        _super.call(this);
    }
    return IfBlock;
})(Block);
exports.IfBlock = IfBlock;

var RepeaterBlock = (function (_super) {
    __extends(RepeaterBlock, _super);
    function RepeaterBlock(source, iterator) {
        _super.call(this);
    }
    return RepeaterBlock;
})(Block);
exports.RepeaterBlock = RepeaterBlock;

function fromSpec(spec) {
    // this needs to become a tree walk that separates out child blocks
    var block;
    if (spec.type === 0 /* Element */ || spec.type === 1 /* Text */) {
        block = new Block();
        block.template = processTemplate(block, [spec]);
    } else {
        block = createBlock(spec);
        block.template = processTemplate(block, spec.children);
    }

    return block;
}
exports.fromSpec = fromSpec;

function createBlock(spec) {
    var block;
    switch (spec.type) {
        case 3 /* Block */:
            block = new Block();
            break;
        case 4 /* IfBlock */:
            block = new IfBlock(spec.source);
            break;
        case 5 /* RepeaterBlock */:
            block = new RepeaterBlock(spec.source, spec.iterator);
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
            var block = createBlock(spec);
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
