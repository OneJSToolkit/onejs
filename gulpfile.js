var gulp = require('gulp');
var mocha = require('gulp-mocha');
var clean = require('gulp-clean');
var tsc = require('gulp-typescript');

var paths = {
    source: ['src/*.ts']
};

gulp.task('clean', function() {
    return gulp.src(['dist'])
        .pipe(clean());
});

gulp.task('tscAMD', ['clean'], function() {
    var tsResult = gulp.src(paths.source)
        .pipe(tsc({
            module: 'amd',
            declarationFiles: true
        }));

    
    tsResult.dts.pipe(gulp.dest('dist/amd'));

    return tsResult.js.pipe(gulp.dest('dist/amd'));
});

gulp.task('tscCommonJS', ['clean'], function() {
    var tsResult = gulp.src(paths.source)
        .pipe(tsc({
            module: 'commonjs',
            declarationFiles: true
        }));

    
    tsResult.dts.pipe(gulp.dest('dist/commonjs'));

    return tsResult.js.pipe(gulp.dest('dist/commonjs'));
});

gulp.task('cleanTest', function() {
    return gulp.src(['bin'])
        .pipe(clean());
});

gulp.task('copyDist', ['tscAMD', 'tscCommonJS'], function() {
    return gulp.src('dist/commonjs/*.js')
        .pipe(gulp.dest('bin/src'));
});

gulp.task('tscTest', ['cleanTest', 'copyDist'], function() {
    var tsResult = gulp.src('test/*.ts')
        .pipe(tsc({
            module: 'commonjs'
        }));

    return tsResult.js.pipe(gulp.dest('bin/test'));
});

gulp.task('test', ['tscTest'], function() {
    return gulp.src('bin/test/*.js', {read: false})
        .pipe(mocha());
});

gulp.task('default', ['tscAMD', 'tscCommonJS']);

gulp.task('watch', ['default'], function() {
    return gulp.watch('src/**/*', ['default']);
});
