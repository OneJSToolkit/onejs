define(["require", "exports"], function(require, exports) {
    var DomUtils = (function () {
        function DomUtils() {
        }
        DomUtils.toggleClass = function (element, className, isEnabled) {
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
        };

        DomUtils.loadStyles = function (rules) {
            var styleEl = document.createElement('style');

            styleEl.type = "text/css";
            styleEl.appendChild(document.createTextNode(rules));
            document.head.appendChild(styleEl);
        };
        return DomUtils;
    })();

    
    return DomUtils;
});
