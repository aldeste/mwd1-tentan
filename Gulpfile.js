'use strict';

var gulp = require('gulp'),
  // SASS
  sass = require('gulp-sass'),
  // PostCss used to fix and optimize rendered css file
  postcss = require('gulp-postcss'),
  // Makes maps
  sourcemaps = require('gulp-sourcemaps'),
  // Rename file before output, used to name .min file
  rename = require('gulp-rename'),
  // Truncate z-index values to lowest possible.
  zindex = require('postcss-zindex'),
  // Removes unused fonts from css. Post-css plugin.
  discardfontface = require('postcss-discard-font-face'),
  // Merge similar css rules adjasent to each other.
  mergerules = require('postcss-merge-rules'),
  // Merges media queries
  mqpacker = require('css-mqpacker'),
  // Prefixes everything. Post-css plugin.
  autoprefixer = require('autoprefixer'),
  // minify CSS.
  morecss = require('gulp-more-css'),
  // Removes unused css
  uncss = require('gulp-uncss'),
  // Refresh browser on cue.
  browserSync = require('browser-sync'),
  // SVG fixers
  svgstore = require('gulp-svgstore'),
  svgmin = require('gulp-svgmin'),
  // Image optimization,
  image = require('gulp-image'),
  // Resize images, requires imagemagick or graphicsmagic
  imageResize = require('gulp-image-resize'),
  // Plumber, don't break my flow when I work
  plumber = require('gulp-plumber'),
  // Jade, HTML generator
  jade = require('gulp-jade'),
  // Convert HTML to Jade, used for SVGs.
  html2jade = require('gulp-html2jade'),
  // Parse JSON files, used with jade.
  data = require('gulp-data'),
  path = require('path'),
  fs = require('fs'),
  // Minify html files
  minifyHTML = require('gulp-minify-html'),
  // Display size of files.
  size = require('gulp-size'),
  // Only get changed files.
  changed = require('gulp-changed'),
  // merge-stream, output multilple tasks to multiple destinations
  merge = require('merge-stream'),
  // Removes files
  clean = require('gulp-clean');

// Reload on filechange
gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'app'
    }
  });
});

// Styles
gulp.task('styles', function() {
  return gulp.src('app/scss/style.scss')
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(changed('app/scss/', {extension: '.css'}))
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer({
        browsers: ['last 3 version']
      }),
      mqpacker({
        sort: true
      }),
      discardfontface,
      mergerules,
      zindex
    ]))
    .pipe(sourcemaps.write())
    .pipe(size())
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// SVGs
gulp.task('svg', function() {
  return gulp
    .src('app/svg/*.svg')
    .pipe(image({ svgo: true }))
    .pipe(rename({prefix: 'icon-'}))
    .pipe(svgmin())
    .pipe(svgstore())
    .pipe(html2jade({bodyless: true}))
    .pipe(gulp.dest('app/template/components/'));
});

// Images
gulp.task('img', function(tmp) {
    gulp.src(['app/img/src/**/*.+(png|jpg|jpeg|gif|svg)'])
    .pipe(imageResize({
      width : 600,
      height : 600,
      crop : true
    }))
    .pipe(image({
      pngquant: true,
      optipng: true,
      zopflipng: true,
      advpng: true,
      jpegRecompress: true,
      jpegoptim: false,
      mozjpeg: true,
      gifsicle: true,
      svgo: true
    }))
    .pipe(gulp.dest('app/img'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// HTMLs
gulp.task('template', function() {
  return gulp
    .src('./app/template/*.jade')
    .pipe(plumber())
    .pipe(data(function(file) {
      return JSON.parse(fs.readFileSync('./app/template/data.json'));
    }))
    .pipe(jade({pretty: false}))
    .pipe(minifyHTML())
    .pipe(size())
    .pipe(gulp.dest('./app/'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// PRODUCTION
gulp.task('clean', function () {
  return gulp.src('dist', {read: false})
    .pipe(clean());
});

gulp.task('dist:html', function() {
  return gulp
    .src('app/*.html')
    .pipe(gulp.dest('dist'))
});

gulp.task('dist:css', function() {
  return gulp
    .src('app/css/*.css')
    .pipe(uncss({
      html: ['app/**/*.html']
    }))
    .pipe(morecss( {radical: false} ))
    .pipe(size())
    .pipe(gulp.dest('dist/css'))
});

gulp.task('dist:img', function() {
  return gulp
    .src(['app/img/**/*.+(png|jpg|jpeg|gif|svg)', '!app/img/{src,src/**}'])
    .pipe(gulp.dest('dist/img'))
});

gulp.task('dist:icons', function() {
  return gulp
    .src(['app/*.+(png|ico)', 'app/browserconfig.xml', 'app/manifest.json'])
    .pipe(gulp.dest('dist/'))
});

gulp.task('dist:js', function() {
  return gulp
    .src('app/js/*.js')
    .pipe(gulp.dest('dist/js'))
});

gulp.task('dist:fonts', function() {
  return gulp
    .src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'))
});

// Watch
gulp.task('watch', ['browserSync', 'template', 'styles'], function() {
  gulp.watch('./app/scss/**/*.scss', ['styles']);
  gulp.watch('./app/template/**/*.+(jade|json)', ['template']);
  gulp.watch('./app/index.html', browserSync.reload);
});

// Default gulp task
gulp.task('default', ['styles', 'template', 'watch']);
gulp.task('dist', ['dist:html', 'dist:css', 'dist:img', 'dist:icons', 'dist:js', 'dist:fonts']);
