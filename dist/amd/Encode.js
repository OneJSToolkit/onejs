define(["require", "exports"], function(require, exports) {
    var Encode = (function () {
        function Encode() {
        }
        // TODO
        Encode.toHtml = function (val) {
            return String(Encode.toSafe(val)).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        Encode.toHtmlAttr = function (val) {
            return Encode.toHtml(val);
        };

        Encode.toJS = function (val) {
            return val || '';
        };

        Encode.toUrl = function (val) {
            return Encode.toSafe(val);
        };

        Encode.toSafe = function (val) {
            return val || '';
        };
        return Encode;
    })();

    
    return Encode;
});
