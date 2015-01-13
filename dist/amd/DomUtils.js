/// <summary>
/// DOM utilities, including helpers for injecting styles, creating elements, toggling classes.
/// </summary>
define(["require", "exports"], function(require, exports) {
    var TEXT_SETTING_METHOD;

    var DomUtils;
    (function (DomUtils) {
        function toggleClass(element, className, isEnabled) {
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
        DomUtils.toggleClass = toggleClass;

        function loadStyles(rules) {
            var styleEl = document.createElement('style');
            styleEl.setAttribute('type', 'text/css');

            if (styleEl['styleSheet']) {
                // For IE < 9
                styleEl['styleSheet'].cssText = rules;
            } else {
                styleEl.appendChild(document.createTextNode(rules));
            }

            var head = document.getElementsByTagName('head')[0];
            head.appendChild(styleEl);
        }
        DomUtils.loadStyles = loadStyles;

        function setText(el, text) {
            if (TEXT_SETTING_METHOD === undefined) {
                TEXT_SETTING_METHOD = (DomUtils.ce('div').textContent !== void (0)) ? 'textContent' : 'innerText';
            }

            el[TEXT_SETTING_METHOD] = text;
        }
        DomUtils.setText = setText;
        function ce(tagName, attributes, children) {
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
        DomUtils.ce = ce;

        function ct(val) {
            return document.createTextNode(val);
        }
        DomUtils.ct = ct;

        function createComment(value) {
            return document.createComment(value);
        }
        DomUtils.createComment = createComment;

        function insertAfter(newChild, sibling) {
            var parent = sibling.parentNode;
            var next = sibling.nextSibling;
            if (next) {
                // IE does not like undefined for refChild
                parent.insertBefore(newChild, next);
            } else {
                parent.appendChild(newChild);
            }
        }
        DomUtils.insertAfter = insertAfter;
    })(DomUtils || (DomUtils = {}));

    
    return DomUtils;
});
