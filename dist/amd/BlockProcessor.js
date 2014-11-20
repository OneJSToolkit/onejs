define(["require", "exports", './Block', './BlockType', './IfBlock', './RepeaterBlock'], function(require, exports, Block, BlockType, IfBlock, RepeaterBlock) {
    function fromSpec(view, spec) {
        var block;
        if (spec.type === 0 /* Element */ || spec.type === 1 /* Text */ || spec.type === 6 /* View */) {
            block = new Block(view, null);
            block.template = exports.processTemplate(block, [spec]);
        } else {
            block = createBlock(view, null, spec);
            block.template = exports.processTemplate(block, spec.children);
        }

        return block;
    }
    exports.fromSpec = fromSpec;

    function createBlock(view, parent, spec) {
        var block;
        switch (spec.type) {
            case 3 /* Block */:
                block = new Block(view, parent);
                break;
            case 4 /* IfBlock */:
                block = new IfBlock(view, parent, spec.source);
                break;
            case 5 /* RepeaterBlock */:
                block = new RepeaterBlock(view, parent, spec.source, spec.iterator, spec.children);
                break;
        }

        return block;
    }

    function processTemplate(parent, template) {
        return template.map(function (spec) {
            if (spec.type === 0 /* Element */) {
                if (spec.children) {
                    // allow two repeaters to share the same blockTemplate
                    spec = {
                        type: 0 /* Element */,
                        tag: spec.tag,
                        attr: spec.attr,
                        binding: spec.binding,
                        // children has to be unique per repeater since blocks
                        // are processed into comments
                        children: exports.processTemplate(parent, spec.children)
                    };
                }
            } else if (spec.type === 3 /* Block */ || spec.type === 4 /* IfBlock */ || spec.type === 5 /* RepeaterBlock */) {
                var block = createBlock(parent.view, parent, spec);
                if (spec.type !== 5 /* RepeaterBlock */) {
                    block.template = exports.processTemplate(block, spec.children);
                }
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
    exports.processTemplate = processTemplate;
});
