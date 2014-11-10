import IBinding = require('./IBinding');

class Binding {
    id: string;
    element: HTMLElement;
    desc: IBinding;

    constructor(id: string, element: HTMLElement, desc: IBinding) {
        this.id = id;
        this.element = element;
        this.desc = desc;
    }
}

export = Binding;