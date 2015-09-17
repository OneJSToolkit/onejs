import BlockType = require('./BlockType');
import Block = require('./Block');
import IBinding = require('./IBinding');

interface IBlockSpec {
    type: BlockType;
    children?: IBlockSpec[];

    //Element
    tag?: string;
    attr?: { [key: string]: string };
    binding?: IBinding;

    //Text and Comment
    value?: string;

    //Comment
    owner?: Block;

    //IfBlock and RepeaterBlock
    source?: string;

    //RepeaterBlock
    iterator?: string;

    //View
    name?: string;
}

export = IBlockSpec;