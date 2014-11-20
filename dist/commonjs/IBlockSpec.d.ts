import BlockType = require('BlockType');
import Block = require('Block');
import IBinding = require('IBinding');
interface IBlockSpec {
    type: BlockType;
    children?: IBlockSpec[];
    tag?: string;
    attr?: {
        [key: string]: string;
    };
    binding?: IBinding;
    value?: string;
    owner?: Block;
    source?: string;
    iterator?: string;
    name?: string;
}
export = IBlockSpec;
