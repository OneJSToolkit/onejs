import IBinding = require('./IBinding');
declare class Binding {
    public id: string;
    public element: HTMLElement;
    public desc: IBinding;
    constructor(id: string, element: HTMLElement, desc: IBinding);
}
export = Binding;
