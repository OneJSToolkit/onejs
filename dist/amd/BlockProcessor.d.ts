import Block = require('./Block');
import IBlockSpec = require('./IBlockSpec');
import View = require('./View');
export declare function fromSpec(view: View, spec: IBlockSpec): Block;
export declare function processTemplate(parent: Block, template: IBlockSpec[]): IBlockSpec[];
