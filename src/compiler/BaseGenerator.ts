import CompiledViewTemplate = require('./CompiledViewTemplate');

var CRLF = '\r\n';
var INDENT = '    ';

/// <summary>
/// Base generator class that others generators can subclass from. Contains common
/// generator utilities that can be reused, like _addLine, _getIndent, etc. Output
/// is always accessible via the public output property, resulting compiled template
/// is accessible from the template property.
/// </summary>
class BaseGenerator {
    public output = '';
    public template: CompiledViewTemplate;

    public _getTemplate(templateContent: string): CompiledViewTemplate {
        this._reset();

        this.template = new CompiledViewTemplate(templateContent);

        if (this.template.errors.length) {
            var errorMessage = this.template.errors.join('\n');

            throw errorMessage;
        }

        return this.template;
    }

    public _reset() {
        this.output = '';
        this.template = null;
    }


    public _addLine(message ? : string, indentDepth ? : Number) {
        this.output += this._getIndent(indentDepth || 0) + (message || '') + CRLF;
    }

    public _getIndent(depth: Number) {
        var _output = '';

        for (var i = 0; i < depth; i++) {
            _output += INDENT;
        }

        return _output;
    }

    public _toTitleCase(val: string): string {
        return val.substr(0, 1).toUpperCase() + val.substr(1);
    }
}

export = BaseGenerator;