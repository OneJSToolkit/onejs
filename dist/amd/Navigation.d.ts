import EventGroup = require('./EventGroup');
declare class Navigation {
    public isRebasingEnabled: boolean;
    public url: string;
    public viewParams: any;
    public viewParamsString: string;
    public _events: EventGroup;
    constructor();
    public navigateTo(url: string, frameId?: string): void;
    public reload(): void;
    public _updateUrlState(): boolean;
    public _pushState(viewParams: any): void;
    public _popState(): void;
    public _replaceState(viewParams: any): void;
}
export = Navigation;
