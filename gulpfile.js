'use strict';

var coveralls = require('gulp-coveralls');
var del = require('del');
var exec = require('child_process').exec;
var flatten = require('gulp-flatten');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var coveralls = require('gulp-coveralls');
var tsc = require('gulp-typescript');
var oneJsCompiler = require('gulp-onejs-build');
var karma = require('karma').server;

oneJsCompiler.gulpTasks.all({
    gulp: gulp,
    rootDir: __dirname,
    karma: karma
});

var shouldExit = true;

gulp.task('tdd', [], function (done) {
    karma.start({
        configFile: __dirname + '/karma.conf.js'
    }, done);
});

gulp.task('ciTest', ['test-preprocess'], function (done) {
    karma.start({
        configFile: __dirname + '/karma-ci.conf.js'
    }, done);
});

gulp.task('covertest', ['ciTest'], function() {
    return gulp.src('bin/coverage/**/lcov.info')
});

var paths = {
    app: 'app/',
    dist: 'dist/',
    amd: 'dist/amd',
    commonjs: 'dist/commonjs',
    appSourceDest: 'app/src',
    appTestDest: 'app/test',
    libSource: ['src/**/*.ts'],
    libTest: ['test/**/*.ts']
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

gulp.task('build', ['build-source', 'build-test']);

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

gulp.task('watch', ['default'], function() {
    shouldExit = false;
    return gulp.watch(oneJsCompiler.gulpTasks.paths.src.glob, ['default']);
});

gulp.task('default', ['build', 'test']);
