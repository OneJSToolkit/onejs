/// <summary>
/// DOM utilities, including helpers for injecting styles, creating elements, toggling classes.
/// </summary>

var TEXT_SETTING_METHOD;

module DomUtils {
    export function toggleClass(element, className, isEnabled) {
        var classList = element._classes = element._classes || (element.className ? element.className.split(' ') : []);
        var index = classList.indexOf(className);

        if (isEnabled) {
            if (index == -1) {
                classList.push(className);
            }
        } else if (index > -1) {
            classList.splice(index, 1);
        }

        element.className = classList.join(' ');
    }

    export function loadStyles(rules) {
        var styleEl = document.createElement('style');

        styleEl.type = "text/css";
        styleEl.appendChild(document.createTextNode(rules));
        document.head.appendChild(styleEl);
    }

    export function setText(el, text) {
        if (TEXT_SETTING_METHOD === undefined) {
            TEXT_SETTING_METHOD = (DomUtils.ce('div').textContent !== void(0)) ? 'textContent' : 'innerText';
        }

        el[TEXT_SETTING_METHOD] = text;
    }
    export function ce(tagName: string, attributes?: { [key: string]: string }, children?: Node[]): HTMLElement {
        var el = document.createElement(tagName);

        if (attributes) {
            var attributeKeys = Object.keys(attributes);
            for (var i = 0; i < attributeKeys.length; i++) {
                var attribute = attributeKeys[i];
                el.setAttribute(attribute, attributes[attribute]);
            }
        }

        if (children) {
            for (var i = 0; i < children.length; i++) {
                el.appendChild(children[i]);
            }
        }

        return el;
    }


    export function ct(val: string): Text {
        return document.createTextNode(val);
    }

    export function createComment(value: string): Comment {
        return document.createComment(value);
    }

    export function insertAfter(newChild: Node, sibling: Node) {
        var parent = sibling.parentNode;
        var next = sibling.nextSibling;
        if (next) {
            // IE does not like undefined for refChild
            parent.insertBefore(newChild, next);
        } else {
            parent.appendChild(newChild);
        }
    }
}

export = DomUtils;