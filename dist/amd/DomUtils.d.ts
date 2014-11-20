declare module DomUtils {
    function toggleClass(element: any, className: any, isEnabled: any): void;
    function loadStyles(rules: any): void;
    function setText(el: any, text: any): void;
    function ce(tagName: string, attributes?: {
        [key: string]: string;
    }, children?: Node[]): HTMLElement;
    function ct(val: string): Text;
    function createComment(value: string): Comment;
    function insertAfter(newChild: Node, sibling: Node): void;
}
export = DomUtils;
