import Block = require('./Block');
import BlockType = require('./BlockType');
import IBlockSpec = require('./IBlockSpec');
import IfBlock = require('./IfBlock');
import RepeaterBlock = require('./RepeaterBlock');
import View = require('./View');

export function fromSpec(view: View, spec: IBlockSpec): Block {

    var block: Block;
    if (spec.type === BlockType.Element || spec.type === BlockType.Text || spec.type === BlockType.View) {
        block = new Block(view, null);
        block.template = processTemplate(block, [spec]);
    } else {
        block = createBlock(view, null, spec);
        block.template = processTemplate(block, spec.children);
    }

    return block;
}

function createBlock(view: View, parent: Block, spec: IBlockSpec): Block {

    var block: Block;
    switch (spec.type) {
        case BlockType.Block:
            block = new Block(view, parent);
            break;
        case BlockType.IfBlock:
            block = new IfBlock(view, parent, spec.source);
            break;
        case BlockType.RepeaterBlock:
            block = new RepeaterBlock(view, parent, spec.source, spec.iterator, spec.children);
            break;
    }

    return block;
}

export function processTemplate(parent: Block, template: IBlockSpec[]): IBlockSpec[] {

    return template.map(function (spec) {

        if (spec.type === BlockType.Element) {
            if (spec.children) {
                // allow two repeaters to share the same blockTemplate
                spec = {
                    type: BlockType.Element,
                    tag: spec.tag,
                    attr: spec.attr,
                    binding: spec.binding,
                    // children has to be unique per repeater since blocks
                    // are processed into comments
                    children: processTemplate(parent, spec.children)
                };
            }
        } else if (spec.type === BlockType.Block || spec.type === BlockType.IfBlock || spec.type === BlockType.RepeaterBlock) {
            var block = createBlock(parent.view, parent, spec);
            if (spec.type !== BlockType.RepeaterBlock) {
                block.template = processTemplate(block, spec.children);
            }
            parent.children.push(block);
            spec = {
                type: BlockType.Comment,
                owner: block,
                value: 'block'
            };
        }
        return spec;
    });
}
