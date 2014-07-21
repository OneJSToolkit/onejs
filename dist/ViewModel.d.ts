declare class ViewModel {
    private events;
    constructor(data?: any);
    public dispose(): void;
    public setData(data: any, forceChange?: boolean): void;
    public onInitialize(): void;
    public onActivate(subControls: any): void;
    public onDeactivate(): void;
    public change(args: any): void;
}
export = ViewModel;
