'use strict';

const gulp = require('gulp');

const pug = require('gulp-pug');

const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');

const sourcemaps = require('gulp-sourcemaps')

// pre-release babel 7
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');

const imagemin = require('gulp-imagemin');

const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');
const cheerio = require('gulp-cheerio');


const plumber = require('gulp-plumber'); 
const notify = require('gulp-notify');

const gulpif = require('gulp-if');

const debug = require('gulp-debug');

const newer = require('gulp-newer');
const cached = require('gulp-cached');
const remember = require('gulp-remember');

const rename = require('gulp-rename');
const del = require('del');

const browserSync = require('browser-sync').create();

const paths = require('./paths.json').paths;

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

gulp.task('del', () => {
  return del(paths.baseDir + '/*');
});

gulp.task('html:build', () => {
  return gulp.src(paths.html.src + '/temp.pug')
  .pipe(plumber({
    errorHandler: err => {
      notify.onError({
        title: 'html build error',
        message: err.message
      })(err)
    }
  }))
  .pipe(debug({title: 'html'}))
  .pipe(pug(gulpif(isDevelopment, {pretty: true })))
  .pipe(gulp.dest(paths.html.dest));
});

gulp.task('css:copy', () => {
  return gulp.src(paths.libs.css)
  .pipe(gulp.dest(paths.baseDir + '/'));
});

/* gulp.task('css:copy', () => {
  return gulp.src(paths.libs.js)
  .pipe(newer(paths.baseDir + '/'))
  .pipe(gulp.dest(paths.baseDir + '/'));
}); */

gulp.task('bootstrap-css:build', () => {
  return gulp.src(paths.css.src + '/bootstrap.scss')
  .pipe(newer(paths.css.dest))
  .pipe(sass())
  .pipe(rename('bootstrap.min.css'))
  .pipe(gulp.dest(paths.css.dest));
});

gulp.task('css:build', () => {
  return gulp.src(paths.css.src + '/custom.scss')
  .pipe(plumber({
    errorHandler: err => {
      notify.onError({
        title: 'css build error',
        message: err.message
      })(err)
    }
  }))
  .pipe(cached('csscache'))
  .pipe(debug({title: 'css'}))
  .pipe(gulpif(isDevelopment, sourcemaps.init()))
  .pipe(remember('csscache'))
  .pipe(sass())
  .pipe(autoprefixer({
    browsers: ['last 2 versions']
  }))
  .pipe(rename('custom.min.css'))
  .pipe(gulpif(isDevelopment, sourcemaps.write('.')))
  .pipe(gulp.dest(paths.css.dest));
});

gulp.task('js:copy', () => {
  return gulp.src(paths.libs.js)
  .pipe(newer(paths.baseDir + '/'))
  .pipe(gulp.dest(paths.baseDir + '/'));
});

gulp.task('bootstrap-js:build', () => {
  return gulp.src(paths.js.src + '/bootstrap.js')
  .pipe(newer(paths.js.dest))
  .pipe(concat('bootstrap.min.js'))
  .pipe(gulp.dest(paths.js.dest));
});

gulp.task('js:build', () => {
  return gulp.src([
    paths.js.src + '/test.js'
  ])
  .pipe(plumber({
    errorHandler: err => {
      notify.onError({
        title: 'js build error',
        message: err.message
      })(err)
    }
  }))
  .pipe(cached('jscache'))
  .pipe(debug({title: 'js'}))
  .pipe(gulpif(isDevelopment, sourcemaps.init()))
  .pipe(remember('jscache'))
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(gulpif(!isDevelopment, uglify()))
  .pipe(concat('common.min.js'))
  .pipe(gulpif(isDevelopment, sourcemaps.write('.')))
  .pipe(gulp.dest(paths.js.dest));
});

gulp.task('fonts:copy', () => {
  return gulp.src(paths.fonts.src + '/**/*.{ttf,woff,woff2,eot,svg}')
  .pipe(newer(paths.fonts.dest))
  .pipe(gulp.dest(paths.fonts.dest));
});

gulp.task('img:copy', () => {
  return gulp.src(paths.img.src + '/**/**/*.{png,jpg}')
  .pipe(newer(paths.img.dest))
  .pipe(imagemin({
    optimizationLevel: 5
  }))
  .pipe(gulp.dest(paths.img.dest));
});

gulp.task('svg:sprite', () => {
  return gulp.src(paths.svg.src + '/*.svg')
  .pipe(newer(paths.svg.dest))
  .pipe(svgmin(function (file) {
    return {
      plugins: [{
        cleanupIDs: {
          minify: true
        }   
      }]
    }
  }))
  .pipe(svgstore({inlineSvg: true}))
  .pipe(cheerio({
    run: function($) {
      $('svg').attr('style', 'display:none');
    },
    parserOptions: {
      xmlMode: true
    }
  }))
  .pipe(rename('sprite-svg.svg'))
  .pipe(gulp.dest(paths.svg.dest));
});

gulp.task('watch', () => {
  gulp.watch(paths.html.src + '/**/**/*.pug', gulp.series('html:build'));
  gulp.watch(paths.css.src + '/**/*.scss', gulp.series('css:build'));
  gulp.watch(paths.js.src + '/*.js', gulp.series('js:build'));
  gulp.watch(paths.fonts.src + '/**/*.{ttf,woff,woff2,eot,svg}', gulp.series('fonts:copy'));
  gulp.watch(paths.img.src + '/**/**/*.{png,jpg}', gulp.series('img:copy'));
  gulp.watch(paths.svg.src + '/**/*.svg', gulp.series('svg:sprite'));
});

gulp.task('serve', () => {
  browserSync.init({
    server: paths.baseDir + '/'
  });
  gulp.watch(paths.baseDir + '/**/**/*.*').on('change', browserSync.reload);    
});

gulp.task('bootstrap:build', gulp.series('bootstrap-css:build', 'bootstrap-js:build'));

gulp.task('build', 
  gulp.series('del', 'fonts:copy', 'img:copy', 'svg:sprite', 'js:copy', 'bootstrap:build','html:build', 'css:build', 'js:build'));

gulp.task('default', gulp.series('build', gulp.parallel('watch', 'serve')));