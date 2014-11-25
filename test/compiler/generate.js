var TypeScriptViewModelGenerator = require('../../dist/commonjs/TypeScriptViewModelGenerator');
var TypeScriptGenerator = require('../../dist/commonjs/TypeScriptGenerator');
var TypeScripTestStubGenerator = require('../../dist/commonjs/TypeScriptTestStubGenerator');
var fs = require('fs');
var path = require('path');
var os = require('os');

if (process.argv.length < 3) {
    console.log('usage: node generate.js template.html outputdirectory');
    console.log('if outputdirectory is not specified, temp directory will be used');
} else {
    var filePath = process.argv[2];
    var outputPath = process.argv[3] || os.tmpdir();
    var fileName = path.basename(filePath, path.extname(filePath));
    var fileContent = fs.readFileSync(filePath, 'utf8').toString();

    var tsGenerator = new TypeScriptGenerator();
    var interfaceGenerator = new TypeScriptViewModelGenerator();
    var testStubGenerator = new TypeScripTestStubGenerator();

    fs.writeFileSync(path.resolve(outputPath, fileName + '.ts'), tsGenerator.generate(fileContent, fileName));
    fs.writeFileSync(path.resolve(outputPath, 'I' + tsGenerator.template.name + 'Model.ts'), interfaceGenerator.generate(fileContent));
    fs.writeFileSync(path.resolve(outputPath, fileName + 'TestStub.ts'), testStubGenerator.generate(fileContent, fileName));
}
