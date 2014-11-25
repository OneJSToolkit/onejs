interface IChildViewMap<T> {
    [name: string]: IChildView<T>;
}

interface IChildView<T> {
    name: string;
    type: string;
    fullType: string;
    baseType: string;
    fullBaseType: string;
    options: string;
    data: string;
    shouldImport: boolean;
    template: T;
}