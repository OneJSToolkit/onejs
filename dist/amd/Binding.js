define(["require", "exports"], function(require, exports) {
    var Binding = (function () {
        function Binding(id, element, desc) {
            this.id = id;
            this.element = element;
            this.desc = desc;
        }
        return Binding;
    })();

    
    return Binding;
});
