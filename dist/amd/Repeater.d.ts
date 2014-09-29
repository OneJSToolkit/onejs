import View = require('./View');
import List = require('./List');
declare class Repeater extends View {
    public viewName: string;
    public collectionName: string;
    public itemName: string;
    public indexName: string;
    public childViewType: typeof View;
    public baseClass: string;
    public removeDelay: number;
    public _currentList: List;
    public onRender(): HTMLElement;
    public getChildElements(): HTMLElement[];
    public onViewModelChanged(changeArgs: any): void;
    public _diffChildren(): void;
    public _insertChild(item: any, i: any): void;
    public _removeChild(i: any): void;
    public _createChild(item: any, index: any): View;
    public _updateChildData(control: any, item: any, index: any): void;
    public _bindings: {
        "id": string;
        "childId": string;
    }[];
}
export = Repeater;
