import Encode = require('Encode');

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
}

export = DomUtils;