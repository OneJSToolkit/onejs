declare class DomUtils {
    static toggleClass(element: any, className: any, isEnabled: any): void;
    static loadStyles(rules: any): void;
    static setText(el: any, text: any): void;
    static ce(tagName: string, attributes?: string[], children?: any[], parent?: any): HTMLElement;
    static ct(val: string): Text;
}
export = DomUtils;
