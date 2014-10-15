var gulp = require('gulp');
var mocha = require('gulp-mocha');
var clean = require('gulp-clean');
var coveralls = require('gulp-coveralls');
var tsc = require('gulp-typescript');
var karma = require('karma').server;

var paths = {
    source: ['src/*.ts']
};

var shouldExit = true;

gulp.task('clean', function() {
    return gulp.src(['dist'])
        .pipe(clean());
});

gulp.task('tscAMD', ['clean'], function() {
    var tsResult = gulp.src(paths.source)
        .pipe(tsc({
            module: 'amd',
            target: 'ES5',
            declarationFiles: true
        }));

    
    tsResult.dts.pipe(gulp.dest('dist/amd'));

    return tsResult.js.pipe(gulp.dest('dist/amd'));
});

gulp.task('tscCommonJS', ['clean'], function() {
    var tsResult = gulp.src(paths.source)
        .pipe(tsc({
            module: 'commonjs',
            target: 'ES5',
            declarationFiles: true
        }));

    
    tsResult.dts.pipe(gulp.dest('dist/commonjs'));

    return tsResult.js.pipe(gulp.dest('dist/commonjs'));
});

gulp.task('cleanTest', function() {
    return gulp.src(['bin'])
        .pipe(clean());
});

gulp.task('copyDist', ['tscCommonJS'], function() {
    return gulp.src('dist/commonjs/*.js')
        .pipe(gulp.dest('bin/src'));
});

gulp.task('tscTest', ['cleanTest', 'copyDist'], function() {
    var tsResult = gulp.src('test/*.ts')
        .pipe(tsc({
            module: 'commonjs',
            target: 'ES5'
        }));

    return tsResult.js.pipe(gulp.dest('bin/test'));
});

gulp.task('test', ['tscTest'], function (done) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done);
});

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

gulp.task('default', ['tscAMD', 'tscCommonJS']);

gulp.task('watch', ['default'], function() {
    shouldExit = false;
    return gulp.watch('src/**/*', ['default']);
});
