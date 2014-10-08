var gulp = require('gulp');
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

    tsResult.js.pipe(gulp.dest('dist/amd'));
    tsResult.dts.pipe(gulp.dest('dist/amd'));

    return tsResult;
});

gulp.task('tscCommonJS', ['clean'], function() {
    var tsResult = gulp.src(paths.source)
        .pipe(tsc({
            module: 'commonjs',
            declarationFiles: true
        }));

    tsResult.js.pipe(gulp.dest('dist/commonjs'));
    tsResult.dts.pipe(gulp.dest('dist/commonjs'));

    return tsResult;
});

gulp.task('default', ['tscAMD', 'tscCommonJS']);

gulp.task('watch', ['default'], function() {
    return gulp.watch('src/**/*', ['default']);
});