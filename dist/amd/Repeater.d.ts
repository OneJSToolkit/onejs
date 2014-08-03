import View = require('View');
declare class Repeater extends View {
    public viewName: string;
    public collectionName: string;
    public itemName: string;
    public indexName: string;
    public childViewType: typeof View;
    public onRenderHtml(): string;
    public renderItems(): string;
    public _bindings: {
        "id": string;
        "childId": string;
    }[];
}
export = Repeater;
