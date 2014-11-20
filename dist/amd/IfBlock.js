var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", './Block'], function(require, exports, Block) {
    var IfBlock = (function (_super) {
        __extends(IfBlock, _super);
        function IfBlock(view, parent, source) {
            _super.call(this, view, parent);
            this.inserted = false;
            this.rendered = false;
            this.bound = false;

            this.source = source;
        }
        IfBlock.prototype.render = function () {
            if (!this.rendered && this.getValue(this.source)) {
                _super.prototype.render.call(this);
                this.insert();
                this.rendered = true;
                if (this.bound) {
                    _super.prototype.bind.call(this);
                }
            }
        };

        IfBlock.prototype.bind = function () {
            this.bound = true;
            if (this.rendered) {
                _super.prototype.bind.call(this);
            }
        };

        IfBlock.prototype.update = function () {
            var condition = this.getValue(this.source);

            if (condition && !this.inserted) {
                if (this.rendered) {
                    this.insert();
                } else {
                    this.render();
                }
            } else if (!condition && this.inserted) {
                this.remove();
            }

            if (condition) {
                _super.prototype.update.call(this);
            }
        };

        IfBlock.prototype.insert = function () {
            if (!this.inserted) {
                this.inserted = true;
                this.parent.insertElements(this.elements, this.placeholder);
            }
        };

        IfBlock.prototype.remove = function () {
            if (this.inserted) {
                this.inserted = false;
                this.parent.removeElements(this.elements);
            }
        };
        return IfBlock;
    })(Block);

    
    return IfBlock;
});
