import Encode = require('Encode');

var TEXT_SETTING_METHOD;

class DomUtils {
    static toggleClass(element, className, isEnabled) {
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

    static loadStyles(rules) {
        var styleEl = document.createElement('style');

        styleEl.type = "text/css";
        styleEl.appendChild(document.createTextNode(rules));
        document.head.appendChild(styleEl);
    }

    static setText(el, text) {
        // Hope that we don't run setText before document.body?
        if (!document.body) {
            throw "setText can't be called before body is available.";
        }

        if (TEXT_SETTING_METHOD === undefined) {
            TEXT_SETTING_METHOD = document.body.hasOwnProperty('textContent') ? 'textContent' : 'innerText';
        }

        el[TEXT_SETTING_METHOD] = text;
    }
}

export = DomUtils;