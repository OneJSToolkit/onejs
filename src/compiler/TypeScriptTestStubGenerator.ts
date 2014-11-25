import BaseGenerator = require('./BaseGenerator');
import CompiledViewTemplate = require('./CompiledViewTemplate');

var _testStubPostFix = 'TestStub';
var _baseTestStubClass = 'ViewTestStub';
var _getSubControLocationClass = 'GetSubControlLocation';


/**
 * Generates a TypeScript test stub class from a OneJS template.
 *
 * @constructor
 * @this {TypeScriptTestStubGenerator}
 */
class TypeScriptTestStubGenerator extends BaseGenerator {

    public generate(templateContent: string): string {
        var template = this.template = this._getTemplate(templateContent);

        this._addImports(template)
        this._addClass(template, true);

        this._addLine();
        this._addLine('export = ' + template.name + _testStubPostFix + ';');

        return this.output;
    }

    private _addImports(template: CompiledViewTemplate) {
        var uniqueControlTypes: {
            [key: string]: {
                path: string;
                forceReference?: boolean;
            }
        } = {};

        uniqueControlTypes[_baseTestStubClass] = {
            path: '../onejs/' + _baseTestStubClass
        };

        uniqueControlTypes[template.baseViewType + _testStubPostFix] = {
            path: template.baseViewFullType + _testStubPostFix
        };

        function findImports(currentTemplate: CompiledViewTemplate) {
            var i;

            for (var memberName in currentTemplate.childViews) {

                if (!uniqueControlTypes[_getSubControLocationClass]) {
                    uniqueControlTypes[_getSubControLocationClass] = {
                        path: '../onejs/' + _getSubControLocationClass
                    };
                }

                var childViewDefinition = currentTemplate.childViews[memberName];

                if (childViewDefinition.shouldImport) {
                    uniqueControlTypes[childViewDefinition.type + _testStubPostFix] = {
                        path: childViewDefinition.fullType + _testStubPostFix
                    };
                }

                uniqueControlTypes[childViewDefinition.baseType + _testStubPostFix] = {
                    // TODO: calculate correct base path
                    path: childViewDefinition.fullBaseType + _testStubPostFix
                }
            }
            for (i = 0; i < currentTemplate.subTemplates.length; i++) {
                findImports(currentTemplate.subTemplates[i]);
            }
        }

        findImports(template);

        Object.keys(uniqueControlTypes).forEach((typeName) => {
            var controlType = uniqueControlTypes[typeName];

            var relativePath = controlType.path[0] === '.' ? controlType.path : './' + controlType.path;

            this._addLine('import ' + typeName + ' = require(\'' + relativePath + '\');');
        });
    }

    private _addClass(template: CompiledViewTemplate, rootTemplate: Boolean) {

        this._addLine();
        this._addLine('class ' + template.name + _testStubPostFix + ' extends ' + (rootTemplate ? _baseTestStubClass : template.baseViewType + _testStubPostFix) + ' {');
        this._addChildViewAccessors(template);
        this._addStateAccessors(template);
        this._addLine('}');

        for (var i = 0; i < template.subTemplates.length; i++) {
            this._addClass(template.subTemplates[i], false);
        }
    }

    private _addChildViewAccessors(template: CompiledViewTemplate) {
        this._addLine('originalViewName = \'' + template.name + '\';', 1);

        // Add child views
        for (var memberName in template.childViews) {
            var childViewDefinition = template.childViews[memberName];

            this._addLine(memberName + '(): ' + childViewDefinition.type + _testStubPostFix + ' {', 1);
            this._addLine('return new ' + childViewDefinition.type + _testStubPostFix + '(new ' + _getSubControLocationClass + '(\'' + memberName + '\', this.controlLocation, this.webDriver), this.webDriver);', 2);
            this._addLine('}', 1);
        }
    }

    private _addStateAccessor(source: string) {
        this._addLine(source.replace('.', '_') + '_State<T>() {', 1);
        this._addLine('return this.getState<T>(\'' + source + '\');', 2);
        this._addLine('}', 1);
    }

    private _addStateAccessors(template: CompiledViewTemplate) {
    var _this = this;
    var annotationBlocks = [];

    for (var id in template.annotations) {
        var annotation = template.annotations[id];

        for (var x in annotation) {
            switch (x) {
                case "html":
                case "text":
                    {
                        this._addStateAccessor(annotation[x]);
                        break;
                    }
                case "attr":
                case "className":
                    {
                        for (var y in annotation[x]) {
                            this._addStateAccessor(annotation[x][y]);
                        }
                        break;
                    }
            }
        }
    }
    }
}


export = TypeScriptTestStubGenerator;