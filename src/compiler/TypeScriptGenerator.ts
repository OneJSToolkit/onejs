import BaseGenerator = require('./BaseGenerator');
import CompiledViewTemplate = require('./CompiledViewTemplate');

interface IBindingEventMap {
    [key: string]: string[];
}

interface IBinding {
    className?: IMap;
    css?: IMap;
    text?: string;
    html?: string;
    attr?: IMap;
    events?: IBindingEventMap;
};

enum BlockType {
    Element,
    Text,
    Comment,
    Block,
    IfBlock,
    RepeaterBlock,
    View
}

interface IMap {
    [key: string]: string;
}

interface IBlockSpec {
    type: BlockType;
    children?: IBlockSpec[];

    //Element
    tag?: string;
    attr?: IMap;
    binding?: IBinding;

    //Text
    value?: string;

    //IfBlock and RepeaterBlock
    source?: string;

    //RepeaterBlock
    iterator?: string;

    //View
    name?: string;
}


/// <summary>
/// Generates a TypeScript view class from a OneJS template.
/// </summary>
class TypeScriptGenerator extends BaseGenerator {

    public generate(templateContent: string): string {
        var _this = this;
        var template = this.template = _this._getTemplate(templateContent);
        var interfaceName = 'I' + template.name + 'Model';

        if (template.viewModelType) {
            _this._addLine('import ' + template.viewModelType + ' = require(\'./' + template.viewModelType + '\');');
        }

        _this._addImports(template);

        if (template.cssInclude) {
            var safeName = template.cssInclude.replace('.', '');

            _this._addLine('import ' + safeName + ' = require(\'./' + template.cssInclude + '\');');

            _this._addLine();
            _this._addLine('DomUtils.loadStyles(' + safeName + '.styles);');
        }

        _this._addClass(template);

        _this._addLine();
        _this._addLine('export = ' + template.name + ';');

        return _this.output;
    }

    private _addClass(template: CompiledViewTemplate) {

        this._addLine();
        this._addLine('class ' + template.name + ' extends ' + template.baseViewType + ' {');
        this._addProperties(template);
        this._addOnInitialize(template);
        this._addOnViewModelChanged(template);
        this._addSpec(template);
        this._addLine('}');

        for (var i = 0; i < template.subTemplates.length; i++) {
            this._addClass(template.subTemplates[i]);
        }
    }

    private _addImports(template: CompiledViewTemplate) {
        var uniqueControlTypes: {
            [key: string]: {
                path: string;
                forceReference ? : boolean;
            }
        } = {};

        uniqueControlTypes['View'] = {
            path: '../onejs/View'
        };

        uniqueControlTypes['DomUtils'] = {
            path: '../onejs/DomUtils'
        };

        uniqueControlTypes[template.baseViewType] = {
            path: template.baseViewFullType
        };

        function findImports(currentTemplate: CompiledViewTemplate) {
            var i;

            for (var memberName in currentTemplate.childViews) {
                var childViewDefinition = currentTemplate.childViews[memberName];

                if (childViewDefinition.shouldImport) {
                    uniqueControlTypes[childViewDefinition.type] = {
                        path: childViewDefinition.fullType
                    };
                }

                uniqueControlTypes[childViewDefinition.baseType] = {
                    // TODO: calculate correct base path
                    path: childViewDefinition.fullBaseType
                }
            }
            for (i = 0; i < currentTemplate.subTemplates.length; i++) {
                findImports(currentTemplate.subTemplates[i]);
            }

            for (i = 0; i < currentTemplate.requireList.length; i++) {
                uniqueControlTypes[currentTemplate.requireList[i]] = {
                    // TODO: calculate correct base path
                    path: currentTemplate.requireList[i],
                    forceReference: true
                }
            }
        }

        findImports(template);

        Object.keys(uniqueControlTypes).forEach((typeName) => {
            var controlType = uniqueControlTypes[typeName];

            var relativePath = controlType.path[0] === '.' ? controlType.path : './' + controlType.path;

            this._addLine('import ' + typeName + ' = require(\'' + relativePath + '\');');

            // For imports that have no references, we need to add a var reference to trick TypeScript into including it.
            if (controlType.forceReference) {
                this._addLine(typeName + ';');
            }

        });
    }

    private _addOnInitialize(template) {
        var hasInitialization = false;
        var childView;
        var memberName;

        for (memberName in template.childViews) {
            childView = template.childViews[memberName];
            if (childView.template.isPassThrough || childView.init) {
                hasInitialization = true;
                break;
            }
        }

        if (hasInitialization) {
            this._addLine();
            this._addLine('onInitialize() {', 1);

            this._addLine('super.onInitialize();', 2);

            for (memberName in template.childViews) {
                childView = template.childViews[memberName];

                if (childView.template.isPassThrough) {
                    this._addLine('this.' + memberName + '.owner = ' + (template.parentTemplate ? 'this.owner' : 'this') + ';', 2);
                }
                if (childView.init) {
                    this._addSetData(memberName, childView.init);
                }
            }

            this._addLine('}', 1);
        }
    }
    /*
    private _addOnActivate(template) {
        var childViewsWithEvents = [];

        for (memberName in template.childViews) {
            var childView = template.childViews[memberName];

            if (childView.events) {
                childViewsWithEvents.push(childView);
            }
        }

        if (childViewsWithEvents.length) {
            this._addLine();
            this._addLine('onActivate() {', 1);

            for (var i = 0; i < childViewsWithEvents.length; i++) {

            }

            thils._addLine('}', 1);
        }
    }
*/

    private _addOnViewModelChanged(template) {
        var _this = this;
        var hasChildViewBindings = false;
        var memberName;

        for (memberName in template.childViews) {
            if (template.childViews[memberName].data) {
                hasChildViewBindings = true;
                break;
            }
        }

        if (hasChildViewBindings) {
            _this._addLine();
            _this._addLine('onViewModelChanged(viewModel, args?: any) {', 1);

            this._addLine('super.onViewModelChanged(viewModel, args);', 2);

            for (var memberName in template.childViews) {
                var childViewDefinition = template.childViews[memberName];

                if (childViewDefinition.data) {
                    this._addSetData(memberName, childViewDefinition.data);
                }
            }

            _this._addLine('}', 1);
        }
    }

    private _addSetData(memberName, data) {
        if (data.indexOf('{') == 0) {
            data = data.substr(1, data.length - 2);
            var dataList = data.split(',');
            var isFirst = true;

            data = '{';
            for (var listIndex = 0; listIndex < dataList.length; listIndex++) {
                
                // TODO: replace this with a proper lexer for strings that can support colons inside of strings
                var parts = dataList[listIndex].trim().split(/[:]+/);

                data += (isFirst ? '' : ',') + ' ' + parts[0].trim() + ': ';

                if (this._isLiteral(parts[1])) {
                    data += parts[1].trim();
                } else {
                    data += 'this.getValue(\'' + parts[1].trim() + '\')';
                }

                isFirst = false;
            }
            data += ' }';

        } else {
            data = 'this.getValue(\'' + data + '\')';
        }

        this._addLine('this.' + memberName + '.setData(' + data + ');', 2);
    }

    private _isLiteral(str: string) {
        str = str.trim();

        var isLiteral = false;

        if (str[0] === "'") {
            isLiteral = true;
        } else if (str === 'true') {
            isLiteral = true;
        } else if (str === 'false') {
            isLiteral = true;
        } else if (/^-?\d+\.?\d*$/.test(str)) {
            isLiteral = true;
        }

        return isLiteral;
    }

    private _addProperties(template: CompiledViewTemplate) {
        this._addLine('viewName = \'' + template.name + '\';', 1);

        if (template.options) {
            var optionsBag = eval('(' + template.options + ')');
            for (var optionName in optionsBag) {
                this._addLine(optionName + ' = ' + optionsBag[optionName] + ';', 1);
            }
        }

        if (template.viewModelType) {
            this._addLine('viewModelType = ' + template.viewModelType + ';', 1);
        }

        // Add properties
        for (var memberName in template.childViews) {
            var childViewDefinition = template.childViews[memberName];

            this._addLine(memberName + ' = <any>this.addChild(new ' + childViewDefinition.type + '());', 1);
        }
    }

    private _getSpecObject(template: CompiledViewTemplate): IBlockSpec {
        var firstElement:Element = template.documentElement;

        if (template.documentElement.tagName == 'js-view') {
            firstElement = <Element>template.documentElement.firstChild;
        }
        return this._getSpecElement(firstElement);
    }

    private _getSpecElement(element: Element): IBlockSpec {
        switch (element.tagName) {
            case "js-if":
                return this._getSpecIfElement(element);
                break;
            case "js-repeat":
                return this._getSpecRepeatElement(element);
                break;
            case "js-view":
                return this._getSpecViewElement(element);
                break;

            default:
                return this._getSpecHTMLElement(element);
                break;
        }
    }

    private _getSpecIfElement(element: Element): IBlockSpec {
        return {
            type: BlockType.IfBlock,
            source: element.getAttribute('source'),
            children: this._getSpecChildren(element.childNodes)
        };
    }

    private _getSpecRepeatElement(element: Element): IBlockSpec {
        return {
            type: BlockType.RepeaterBlock,
            source: element.getAttribute('source'),
            iterator: element.getAttribute('iterator'),
            children: this._getSpecChildren(element.childNodes)
        };
    }

    private _getSpecViewElement(element: Element): IBlockSpec {
        return {
            type: BlockType.View,
            name: element.getAttribute('js-name'),
            binding: this._getSpecHTMLElementBinding(element),
            children: this._getSpecChildren(element.childNodes)
        };
    }

    private _getSpecHTMLElementAttributes(element: Element): IMap {
        var map: IMap;
        
        var attrLength = element.attributes.length;
        if (attrLength) {
            map = {};
            for (var i = 0; i < attrLength; i++) {
                var attribute = element.attributes[i];
                map[attribute.name] = attribute.value;
            }
        }
        return map;
    }

    private _getSpecHTMLElementBinding(element: Element): IBinding {
        return element['annotation'];
    }

    private _getSpecHTMLElement(element: Element): IBlockSpec {
        return {
            type: BlockType.Element,
            tag: element.tagName,
            attr: this._getSpecHTMLElementAttributes(element),
            binding: this._getSpecHTMLElementBinding(element),
            children: this._getSpecChildren(element.childNodes)
        };
    }

    private _getSpecTextElement(element: Node): IBlockSpec {
        
        return {
            type: BlockType.Text,
            value: element.nodeValue
        };
    }

    private _getSpecChildren(nodes: NodeList): IBlockSpec[]{
        var children: IBlockSpec[] = [];

        if (nodes.length) {
            for (var i = 0; i < nodes.length; i++) {
                var child = nodes[i];
                if (child.nodeType === child.ELEMENT_NODE) {
                    children.push(this._getSpecElement(<Element>child));
                } else if (child.nodeType === child.TEXT_NODE) {
                    children.push(this._getSpecTextElement(child));
                }
            }
        }

        return children;
    }

    private _addSpec(template: CompiledViewTemplate) {
        this._addLine();
        this._addLine('_spec = <any> {', 1);

        var spec = this._getSpecObject(template);
        var specString = JSON.stringify(spec, null, 4);

        var lines = specString.split('\n');
        lines.shift(); // skip opening {
        lines.pop(); // skip closing }

        lines.forEach((line) => {
            this._addLine(line, 1);
        });

        this._addLine('};', 1);
    }

    private _getIdAttribute(element: HTMLElement): string {
        var idAttribute = '';
        var annotation = element['annotation'];

        if (annotation) {
            idAttribute = ' id="\' + this.id + \'_' + annotation.id + '"';
        }

        return idAttribute;
    }

    private _getCreationMethod(element: HTMLElement, createMethodName: string, annotationObjectName: string, attributeName ? : string): string {
        var annotation = element['annotation'];
        var annotationCollection = annotation ? annotation[annotationObjectName] : null;
        var methodCall = '';
        var valuesToAdd = [];
        var existingValue = element.getAttribute(attributeName) || '';

        if (annotationCollection) {
            // Remove attribute because we're going to use a creation method.
            if (attributeName) {
                element.removeAttribute(attributeName);
            }

            existingValue = "'" + existingValue + "'";

            for (var valueName in annotationCollection) {
                valuesToAdd.push("'" + valueName + "'");
                valuesToAdd.push("'" + annotationCollection[valueName] + "'");
            }

            methodCall = " ' + this." + createMethodName + "(" + existingValue;

            if (valuesToAdd.length) {
                methodCall += ", [" + valuesToAdd.join(',') + "]";
            }

            methodCall += ") + '";
        }

        return methodCall;
    }

    private _getRemainingAttributes(element: HTMLElement): string {
        var attributeContent = [];

        for (var i = 0; i < element.attributes.length; i++) {
            var attribute = element.attributes[i];
            attributeContent.push(attribute.name + '="' + _toHtml(attribute.value) + '"');
        }

        return attributeContent.length ? (' ' + attributeContent.join(' ')) : '';
    }
}

function _toHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}


export = TypeScriptGenerator;