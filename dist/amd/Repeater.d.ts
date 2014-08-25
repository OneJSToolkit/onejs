import View = require('View');
import List = require('List');
declare class Repeater extends View {
    public viewName: string;
    public collectionName: string;
    public itemName: string;
    public indexName: string;
    public childViewType: typeof View;
    public baseClass: string;
    public currentList: List;
    public _endComment: string;
    public _surfaceRoots: any[];
    public onRenderElement(): HTMLElement;
    public getChildElements(): HTMLElement[];
    public onViewModelChanged(changeArgs: any): void;
    public _diffChildren(): void;
    public _createChild(item: any, index: any): View;
    public _updateChildData(control: any, item: any, index: any): void;
    public _bindings: {
        "id": string;
        "childId": string;
    }[];
}
export = Repeater;
