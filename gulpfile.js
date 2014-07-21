var gulp = require('gulp');
var clean = require('gulp-clean');
var tsc = require('gulp-tsc');

var paths = {
  source: [ 'src/*.ts']
};

gulp.task('clean', function() {
  return gulp.src(['dist'])
    .pipe(clean());
});

gulp.task('tsc', ['clean'], function() {
  return gulp.src(paths.source)
    .pipe(tsc({
      module: 'amd',
      declaration: true
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['tsc']);