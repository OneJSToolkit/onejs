class Encode {
    // TODO

    public static toHtml(val: string): string {
        return String(Encode.toSafe(val))
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    public static toHtmlAttr(val: string): string {
        return Encode.toHtml(val);
    }

    public static toJS(val: string): string {
        return val || '';
    }

    public static toUrl(val: string): string {
        return Encode.toSafe(val);
    }

    public static toSafe(val: string): string {
        return val || '';
    }
}

export = Encode;