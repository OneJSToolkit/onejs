var gulp = require('gulp');
var mocha = require('gulp-mocha');
var coveralls = require('gulp-coveralls');
var tsc = require('gulp-typescript');
var karma = require('karma').server;
var del = require('del');
var oneJsCompiler = require('gulp-onejs-compiler');

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

gulp.task('ciTest', ['tscTest'], function (done) {
  karma.start({
    configFile: __dirname + '/karma-ci.conf.js'
  }, done);
});

gulp.task('covertest', ['ciTest'], function() {
    return gulp.src('bin/coverage/**/lcov.info')
        .pipe(coveralls());
});

// karma blocks gulp from exiting without this
gulp.doneCallback = function(err) {
    if(shouldExit) {
        process.exit(err? 1: 0);
    }
}

gulp.task('watch', ['default'], function() {
    shouldExit = false;
    return gulp.watch(oneJsCompiler.gulpTasks.paths.src.glob, ['default']);
});
