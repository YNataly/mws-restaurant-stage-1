/* To clear cache run: gulp cache:clear
   To clear 'build' directory and build develomment assets run: gulp clean-dev-build
   To build develomment assets ('build' directory will be created) run: gulp
   To build production assets ('dist' directory will be created) run: gulp prod
*/

const gulp = require('gulp');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const eslint = require('gulp-eslint');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const imagemin = require('gulp-imagemin');
const htmlreplace = require('gulp-html-replace');
let browserSync = require('browser-sync').create();
const cache = require('gulp-cache');
const del = require('del');
const uglify = require('gulp-uglify');
const runSequence = require('run-sequence');
const gulpIf = require('gulp-if');
const cleanCSS = require('gulp-clean-css');

const allJS = 'all.js';
let isProduction=false;
let baseDir='./build';

gulp.task('default', ['watch']);

gulp.task('clean-dev-build', ['clean'], function(cb) {
  runSequence('default', cb);
});

gulp.task('create-assets', ['copy-html', 'styles', 'scripts', 'images'], function () {

});

gulp.task('watch', ['create-assets'], function () {
  browserSync.init({
    server: { baseDir: `${baseDir}` },
    port: 3000,
    browser: 'chrome.exe'
  }, function(err, bs) {
    console.log(bs.options.get('urls').toJS());
  });

  gulp.watch('./*.html', ['copy-html'], function() { browserSync.reload(); });
  gulp.watch('./css/*.css', ['styles'], function() { browserSync.reload(); });
  gulp.watch('./img/*.+(jpg|png|gif|svg)', ['images'], function() { browserSync.reload(); });
  gulp.watch('./js/**/*.js', ['scripts'], function() { browserSync.reload(); });
});

gulp.task('copy-html', function () {
  return gulp.src('*.html')
    .pipe(htmlreplace({
      'js-file': `js/${allJS}`
    }))
    .pipe(gulpIf(isProduction, gulp.dest('./dist'), gulp.dest('./build')));
});

gulp.task('styles', function () {
  return gulp.src('./css/*.css')
    .pipe(sourcemaps.init())
    .pipe(postcss([autoprefixer()]))
    .pipe(gulpIf(isProduction, cleanCSS()))
    .pipe(sourcemaps.write())
    .pipe(gulpIf(isProduction, gulp.dest('./dist/css'), gulp.dest('./build/css')));
});

gulp.task('clean:images', function(cb) {
  if (isProduction) cb();
  else return del(['./build/img']);
});

gulp.task('clean', function() {
  return del(['./build']);
});

gulp.task('images', ['clean:images'], function () {
  return gulp.src('./img/*.+(jpg|png|gif|svg)')
    .pipe(cache(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ])))
    .pipe(gulpIf(isProduction, gulp.dest('./dist/img'), gulp.dest('./build/img')));
});

gulp.task('eslint', function () {
  return gulp.src('./js/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('scripts', ['eslint'], function () {
  return gulp.src('./js/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat(`${allJS}`))
    .pipe(gulpIf(isProduction, uglify()))
    .pipe(sourcemaps.write())
    .pipe(gulpIf(isProduction, gulp.dest('./dist/js'), gulp.dest('./build/js')));
});

gulp.task('cache:clear', function (callback) {
  return cache.clearAll(callback);
});

/* Build production assets */

gulp.task('clean-dist', function() {
  return del('./dist');
});

gulp.task('initBrowserSync', function() {
  browserSync.init({
    server: { baseDir: `${baseDir}` },
    port: 3000,
    browser: 'chrome.exe'
  }, function(err, bs) {
    console.log(bs.options.get('urls').toJS());
  });
});

gulp.task('prod', ['clean-dist'], function(cb) {
  isProduction=true;
  baseDir='./dist';

  runSequence('create-assets', 'initBrowserSync', cb);
});
