interface IBinding {
    className?: { [key: string]: string };
    css?: { [key: string]: string };
    text?: string;
    html?: string;
    attr?: { [key: string]: string };
    events?: { [key: string]: string[] };
}

export = IBinding;