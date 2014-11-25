import CompiledViewTemplate = require('./CompiledViewTemplate');
import BaseGenerator = require('./BaseGenerator');

/// <summary>
/// Generates a TypeScript view model interface from a OneJS template.
/// </summary>
class TypeScriptViewModelGenerator extends BaseGenerator {
    public generate(templateContent: string): string {
        var _this = this;
        var template = this._getTemplate(templateContent);
        var interfaceName = 'I' + template.name + 'Model';

        _this._addLine('interface ' + interfaceName + ' {');
/*
        // Add properties being bound to.
        for (var propertyName in template.properties) {
            _this._addLine(propertyName + ': ' + template.properties[propertyName].type + ';', 1);
        }

        // Add events being bound to.
        if (template.events.length) {
            _this._addLine();
            template.events.forEach(function(eventName) {
                _this._addLine(eventName + '(eventArgs?: any): boolean;', 1);
            });
        }
*/
        _this._addLine('}');
        _this._addLine();
        _this._addLine('export = ' + interfaceName + ';');

        return _this.output;
    }


}

export = TypeScriptViewModelGenerator;