'use strict';

var coveralls = require('gulp-coveralls');
var del = require('del');
var exec = require('child_process').exec;
var flatten = require('gulp-flatten');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var coveralls = require('gulp-coveralls');
var tsc = require('gulp-typescript');
var oneJsBuild = require('gulp-onejs-build');
var karma = require('karma').server;

oneJsBuild.gulpTasks.all({
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

gulp.task('covertest', ['build', 'test'], function() {
    return gulp.src('coverage/**/lcov.info')
        .pipe(coveralls());
});

gulp.task('watch', ['default'], function() {
    shouldExit = false;
    return gulp.watch(oneJsBuild.gulpTasks.paths.src.glob, ['default']);
});

gulp.task('default', ['build', 'test']);
