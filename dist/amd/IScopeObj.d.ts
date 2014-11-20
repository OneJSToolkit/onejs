interface IScopeObj {
    scope: {
        [key: string]: any;
    };
    parent: IScopeObj;
}
export = IScopeObj;
