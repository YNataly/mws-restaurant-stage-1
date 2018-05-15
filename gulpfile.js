/* To clear cache run: gulp clean-cache
   To clean build of develomment assets ('build' directory will be created) run: gulp clean-dev
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
const htmlreplace = require('gulp-html-replace');
let browserSync = require('browser-sync').create();
const cached = require('gulp-cached');
const del = require('del');
const uglify = require('gulp-uglify');
const runSequence = require('run-sequence');
const gulpIf = require('gulp-if');
const cleanCSS = require('gulp-clean-css');
const responsive = require('gulp-responsive');
const fs = require('fs');

const config={};
config.allJS = 'all.js';
config.isProduction=false;
config.baseDir='./build';
config.imageCacheName='images';
config.CACHE_FILE = './.cache.images.json';

if (fs.existsSync(config.CACHE_FILE)) {
  console.log('Using images cache file at ' + config.CACHE_FILE);
  cached.caches = require(config.CACHE_FILE) || {};
} else {
  console.log('No images cache file found.');
}

gulp.task('default', ['clean'], function(cb) {
  runSequence('watch', cb);
});

gulp.task('clean-dev', ['clean', 'clean-cache', 'clean-images'], function(cb) {
  runSequence('watch', cb);
});

gulp.task('create-assets', ['copy-html', 'styles', 'scripts', 'responsive-images']);

gulp.task('watch', ['create-assets'], function () {
  browserSync.init({
    server: { baseDir: `${config.baseDir}` },
    port: 3000,
    browser: 'chrome.exe'
  }, function(err, bs) {
    console.log(bs.options.get('urls').toJS());
  });

  gulp.watch('./*.html', ['copy-html']);
  gulp.watch('./css/*.css', ['styles']);
  gulp.watch('./img-src/*.jpg', ['responsive-images']);
  gulp.watch('./js/**/*.js', ['scripts']);
  gulp.watch('./build/**/*', browserSync.reload);
});

gulp.task('copy-html', function () {
  return gulp.src('*.html')
    .pipe(htmlreplace({
      'js-file': `js/${config.allJS}`
    }))
    .pipe(gulp.dest(`${config.baseDir}`));
});

gulp.task('styles', function () {
  return gulp.src('./css/*.css')
    .pipe(sourcemaps.init())
    .pipe(postcss([autoprefixer()]))
    .pipe(gulpIf(config.isProduction, cleanCSS()))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(`${config.baseDir}/css`));
});

gulp.task('clean', function() {
  return del(['./build/**', '!./build/img', '!./build']);
});

gulp.task('clean-cache', function (cb) {
  _clearCache();
  cb();
});

gulp.task('clean-images', function() {
  return del(`${config.baseDir}/img`);
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
    .pipe(concat(`${config.allJS}`))
    .pipe(gulpIf(config.isProduction, uglify()))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(`${config.baseDir}/js`));
});

/* Build production assets */

gulp.task('clean-dist', function() {
  return del('./dist');
});

gulp.task('initBrowserSync', function() {
  browserSync.init({
    server: { baseDir: `${config.baseDir}` },
    port: 3000,
    browser: 'chrome.exe'
  }, function(err, bs) {
    console.log(bs.options.get('urls').toJS());
  });
});

gulp.task('prod', ['clean-dist'], function(cb) {
  config.isProduction=true;
  config.baseDir='./dist';

  runSequence('create-assets', 'initBrowserSync', cb);
});

/* Create responsive images */
gulp.task('responsive-images', function() {
  const imgStream = gulp.src('./img-src/*.jpg')
    .pipe(gulpIf(!config.isProduction, cached(config.imageCacheName)))
    .pipe(responsive({
      '*': [{
        width: 800,
        rename: { suffix: '-800_large' }
      }, {
        width: 600,
        rename: { suffix: '-600_medium' }
      }, {
        width: 500,
        rename: { suffix: '-500_medium' }
      }, {
        width: 400,
        rename: { suffix: '-400_small' }
      }, {
        width: 320,
        rename: { suffix: '-320_small' }
      }]
    }, {
      quality: 80,
      progressive: true,
      withMetadata: false,
      skipOnEnlargement: true,
      errorOnUnusedConfig: false,
      errorOnUnusedImage: false,
      errorOnEnlargement: false
    }
    ))
    .pipe(gulp.dest(`${config.baseDir}/img`));

  imgStream.on('end', function () {
    _saveCache();
  });

  return imgStream;
});

function _saveCache() {
  var json = JSON.stringify(cached.caches, null, '  ');
  fs.writeFileSync(config.CACHE_FILE, json);
}

function _clearCache() {
  fs.writeFileSync(config.CACHE_FILE, '{}');
  cached.caches={};
}
