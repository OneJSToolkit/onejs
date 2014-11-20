import Binding = require('./Binding');
import View = require('./View');
import IBlockSpec = require('./IBlockSpec');
import EventGroup = require('./EventGroup');
declare class Block {
    public parent: Block;
    public elements: HTMLElement[];
    public template: IBlockSpec[];
    public children: Block[];
    public view: View;
    public placeholder: Comment;
    public bindings: Binding[];
    public _lastValues: any;
    public scope: {
        [key: string]: string;
    };
    public events: EventGroup;
    constructor(view: View, parent: Block);
    public render(): void;
    public bind(): void;
    public update(): void;
    public dispose(): void;
    public getValue(propertyName: string): any;
    public insertElements(elements: HTMLElement[], refElement: HTMLElement): void;
    public removeElements(elements: HTMLElement[]): void;
    public _updateViewValue(binding: any, bindingType: any, sourcePropertyName: any, bindingDest?: any): void;
    public _bindExternalModel(propName: any): void;
    public _bindEvents(): void;
    public _bindInputEvent(element: HTMLElement, binding: Binding): void;
    public _bindEvent(element: any, eventName: any, targetList: any): void;
    public _processBinding(spec: IBlockSpec, element: HTMLElement): HTMLElement;
}
export = Block;
