define(["require", "exports"], function(require, exports) {
    var Encode = (function () {
        function Encode() {
        }
        Encode.toHtml = function (val) {
            return val || '';
        };

        Encode.toHtmlAttr = function (val) {
            return val || '';
        };

        Encode.toJS = function (val) {
            return val || '';
        };

        Encode.toUrl = function (val) {
            return val || '';
        };

        Encode.toSafe = function (val) {
            return val || '';
        };
        return Encode;
    })();

    
    return Encode;
});
