gulp = require('gulp');
gutil = require('gulp-util');
coffee = require('gulp-coffee');
watch = require('gulp-watch')
sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function() {
  // place code for your default task here
});

gulp.task('coffee', function() {
  gulp.src('./src/*.coffee')
    .pipe(sourcemaps.init())
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./js/'))
});


gulp.task('watch', function() {
  gulp.watch('./src/*.coffee',['coffee'])
});
