declare module DomUtils {
    function toggleClass(element: any, className: any, isEnabled: any): void;
    function loadStyles(rules: any): void;
    function setText(el: any, text: any): void;
    function ce(tagName: string, attributes?: string[], children?: any[], parent?: any): HTMLElement;
    function ct(val: string): Text;
}
export = DomUtils;
