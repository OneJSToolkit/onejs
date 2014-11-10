import Block = require('./Block');
import View = require('./View');

class IfBlock extends Block {

    source: string;
    inserted = false;
    rendered = false;
    bound = false;

    constructor(view: View, parent: Block, source: string) {
        super(view, parent);

        this.source = source;
    }

    render() {
        if (!this.rendered && this.getValue(this.source)) {
            super.render();
            this.insert();
            this.rendered = true;
            if (this.bound) {
                super.bind();
            }
        }
    }

    bind() {
        this.bound = true;
        if (this.rendered) {
            super.bind();
        }
    }

    update() {
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
            super.update();
        }
    }

    insert() {
        if (!this.inserted) {
            this.inserted = true;
            this.parent.insertElements(this.elements, <any>this.placeholder);
        }
    }

    remove() {
        if (this.inserted) {
            this.inserted = false;
            this.parent.removeElements(this.elements);
        }
    }
}

export = IfBlock;