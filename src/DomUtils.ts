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

    export function ce(tagName: string, attributes? : string[], children? : any[], parent?: any): HTMLElement {
        var element = document.createElement(tagName);
        var i;
        var val;

        // Set default attributes.
        for (i = 0; attributes && i < attributes.length; i += 2) {
            element.setAttribute(attributes[i], attributes[i + 1]);
        }

        // Set element on parent if appropriate.
        if (parent) {
            parent.element = element;
        }

        // Append children.
        if (children) {
            for (i = 0; i < children.length; i++) {
                element.appendChild(children[i]);
            }
        }

        return element;
    }

    export function ct(val: string): Text {
        return document.createTextNode(val);
    }
}

export = DomUtils;