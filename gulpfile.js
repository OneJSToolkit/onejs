var coveralls = require('gulp-coveralls');
var del = require('del');
var exec = require('child_process').exec;
var flatten = require('gulp-flatten');
var gulp = require('gulp');
var gutil = require('gulp-util');
var karma = require('karma').server;
var mocha = require('gulp-mocha');
var tsc = require('gulp-typescript');


var paths = {
    app: 'app/',
    dist: 'dist/',
    amd: 'dist/amd',
    commonjs: 'dist/commonjs',
    appSourceDest: 'app/src/lib',
    appTestDest: 'app/test/lib',
    compilerSource: ['src/compiler/**/*.ts'],
    libSource: ['src/lib/**/*.ts'],
    libTest: ['test/lib/**/*.ts']
};

var shouldExit = true;

gulp.task('clean', function(cb) {
    del([paths.dist, paths.app], cb);
});

gulp.task('build-source', ['clean'], function() {
    return gulp.src(paths.libSource)
        .pipe(tsc({
            module: 'amd',
            target: 'ES5',
            declarationFiles: true
        }))
        .pipe(gulp.dest(paths.amd))
        .pipe(gulp.dest(paths.appSourceDest));
});

gulp.task('build-test', ['clean', 'build-source'], function() {
    return gulp.src(paths.libTest)
        .pipe(tsc({
            module: 'amd',
            target: 'ES5',
            declarationFiles: false
        }))
        .pipe(gulp.dest(paths.appTestDest));
});

gulp.task('build-compiler', ['clean'], function() {
    return gulp.src(paths.compilerSource)
        .pipe(tsc({
            module: 'commonjs',
            target: 'ES5',
            declarationFiles: false
        }))
        .pipe(gulp.dest(paths.commonjs));
});

gulp.task('build', ['build-source', 'build-test', 'build-compiler']);

gulp.task('compiler-test', ['build-compiler'], function() {
    return exec('node generate.js LeftNav.html', {
        cwd: 'test/compiler'
    }, function(error, stdout, stderr) {
        if (error) {
            gutil.log(gutil.colors.red(error));
        }
    });
});

gulp.task('test', ['build'], function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});

gulp.task('covertest', ['build','test'], function() {
    return gulp.src('coverage/**/lcov.info')
        .pipe(coveralls());

});

gulp.task('ci', ['covertest', 'compiler-test']);

gulp.task('default', ['build', 'test', 'compiler-test']);
