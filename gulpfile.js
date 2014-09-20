var gulp = require('gulp');
var clean = require('gulp-clean');
var tsc = require('gulp-tsc');

var paths = {
    source: ['src/*.ts']
};

gulp.task('clean', function() {
    return gulp.src(['dist'])
        .pipe(clean());
});

gulp.task('tscAMD', ['clean'], function() {
    return gulp.src(paths.source)
        .pipe(tsc({
            module: 'amd',
            declaration: true
        }))
        .pipe(gulp.dest('dist/amd'));
});

gulp.task('tscCommonJS', ['clean'], function() {
    return gulp.src(paths.source)
        .pipe(tsc({
            module: 'commonjs',
            declaration: true
        }))
        .pipe(gulp.dest('dist/commonjs'));
});

gulp.task('default', ['tscAMD', 'tscCommonJS']);