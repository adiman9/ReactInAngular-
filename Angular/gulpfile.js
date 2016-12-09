var fs = require('fs');
var util = require('util');
var path = require('path');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var minifyHTML = require('gulp-minify-html');
var less = require('gulp-less');
var clean_css = require('gulp-clean-css');
var template = require('gulp-template');
var rename = require('gulp-rename');
var traceur = require('gulp-traceur-cmdline');
var through = require('through2');
var escape = require('js-string-escape');
var headerfooter = require('gulp-headerfooter');

// JS deps.
// Each entry is a 2-element array. The 0th element is the unminified path
// the 1th path is the minified path.

// NO_OP means don't include this when building minified.
var NO_OP = 0;
// MINIFY means explicitly minify the unminified version for production.
var MINIFY = 1;

var js_deps = [
  ['bower_components/angular/angular.js',
   'bower_components/angular/angular.min.js'],
  ['bower_components/angular-route/angular-route.js',
   'bower_components/angular-route/angular-route.min.js'],
  ['bower_components/less/dist/less.js', NO_OP],
  ['bower_components/traceur/traceur.js', NO_OP],
  ['bower_components/es6-module-loader/dist/es6-module-loader-dev.js', NO_OP],
  ['bower_components/underscore/underscore.js',
   'bower_components/underscore/underscore-min.js'],
  ['bower_components/jquery/dist/jquery.js',
   'bower_components/jquery/dist/jquery.min.js']
];

var dev_js_tags = [{
  type: 'text/javascript',
  code: 'System.import("/index.js")'
}];

// These can be less or css
var css_deps = [
  'index.less'
];

// A gulp plugin that compiles a list of XHTML files into a list of statements
//
//    foo(path,contents)
//
// where `path` is
//
//    path.join(options.prefix, filename)
//
// and `contents` is the compactified and escaped XHTML contents of the file.
//
// For example, we might use this to compile my-cool-template.html:
//
//    <div class="my-cool-template">
//      Hello cool template!
//    </div>
//
// into something like:
//
//    $templateCache.put(
//      "src/dom/my-cool-template.html",
//      "<div class=\"my-cool-template\">Hello cool template!</div>"
//    )
//
var xhtmlCache = function(options) {
  var transform = function(file, encoding, callback) {
    var format = options.format || 'xml_cache.put("%s", "%s")';
    var prefix = options.prefix || '';
    var newContents = util.format(
      format,
      path.join(prefix, path.basename(file.path)),
      escape(file.contents.toString().trim())
    );
    file.contents = new Buffer(newContents);
    callback(null, file);
  };
  return through.obj(transform);
};

// Generate a __templates.js which imports app.js and populates its
// $templateCache with minified templates
// It's important that app.js exports its angular app
gulp.task('templates', function () {
  var header = 'app.run(function($templateCache){';
  var footer = '});';
  return gulp.src(['src/dom/*.html'])
    .pipe(minifyHTML({ quotes: true }))
    .pipe(xhtmlCache({
      format: '$templateCache.put("%s", "%s");',
      prefix: 'src/dom'
    }))
    .pipe(concat('__templates.js'))
    .pipe(headerfooter.header(header))
    .pipe(headerfooter.footer(footer))
    .pipe(gulp.dest('tmp/files'));
});

// Generates a __svg-cache.js which slurps in all the SVGs in icons/ui/*svg
// and inserts them into the app's svg_cache service.
gulp.task('svg', function() {
  var header = 'app.run(function(svg_cache_svc){';
  var footer = '});';
  return gulp.src(['icons/ui/*.svg'])
    .pipe(minifyHTML({ quotes: true }))
    .pipe(xhtmlCache({
      format: 'svg_cache_svc.put_svg("%s", "%s");',
      prefix: 'icons/ui'
    }))
    .pipe(concat('__svg-cache.js'))
    .pipe(headerfooter.header(header))
    .pipe(headerfooter.footer(footer))
    .pipe(gulp.dest('tmp/files'));
});

// Concatenates the caches into one __main.js. Important note: there
gulp.task('caches', ['templates', 'svg'], function() {
  return gulp.src(['tmp/files/__templates.js', 'tmp/files/__svg-cache.js'])
    .pipe(concat('__main.js'))
    .pipe(headerfooter.header('import {app} from "../../index.js";'))
    .pipe(gulp.dest('tmp/files'));
});

// Copy all the source files into ./tmp/files
// gulp.task('copy-files', ['caches'], function() {
//   return gulp.src(['./src/**/*.js'], {base:'./src'})
//     .pipe(gulp.dest('tmp/files'));
// });

// Compile __main.js, which imports app.js, which imports everything else
gulp.task('traceur', ['caches'], function() {
  return gulp.src(['tmp/files/__main.js'])
    .pipe(traceur({ modules: 'inline' }))
    .pipe(uglify({ mangle: false }))
    .pipe(gulp.dest('tmp'));
});

// Minify the traceur runtime.
gulp.task('traceur-runtime', function() {
  return gulp.src(['node_modules/traceur/bin/traceur-runtime.js'])
    .pipe(uglify({ mangle: false }))
    .pipe(gulp.dest('tmp'));
});

gulp.task('minify-external-js', function() {
  var files_to_minify = js_deps.filter(
    (d) => d[1] === MINIFY).map((d) => d[0]);
  return gulp.src(files_to_minify)
    .pipe(uglify({ mangle: false }))
    .pipe(concat('minified-external.js'))
    .pipe(gulp.dest('tmp'));
});

// concat and minify JS into ./tmp/all.js
gulp.task('js', ['traceur', 'traceur-runtime', 'templates', 'minify-external-js'], function() {
  var prod_files = js_deps.map((d) => d[1]).filter(
    (c) => c !== NO_OP && c !== MINIFY);
  prod_files.push('tmp/minified-external.js');
  prod_files.push('tmp/traceur-runtime.js');
  prod_files.push('tmp/__main.js');
  return gulp.src(prod_files)
    .pipe(concat('all.js'))
    .pipe(gulp.dest('tmp'));
});

// concat and minify all CSS into ./tmp/all.css
gulp.task('css', function() {
  return gulp.src(css_deps)
    .pipe(concat('all.less'))
    .pipe(less('all.css', {compress:true}))
    .pipe(clean_css())
    .pipe(gulp.dest('tmp'));
});

// generate minified index.html from index.tmpl.html
gulp.task('prod', ['js', 'css'], function() {
  return gulp.src('index.tmpl.html')
    .pipe(rename('index.html'))
    .pipe(template({
      env: 'prod',
      js_string: fs.readFileSync('tmp/all.js', 'utf8'),
      css_string: fs.readFileSync('tmp/all.css', 'utf8')
    }))
    .pipe(gulp.dest('.'));
});

// generate dev-mode index.html that has <link> and <script> tags for everything
// and nothing is minified.
gulp.task('dev', function() {
  return gulp.src('index.tmpl.html')
    .pipe(rename('index.html'))
    .pipe(template({
      env: 'dev',
      js: js_deps.map((d) => d[0]),
      dev_js_tags: dev_js_tags,
      css: css_deps
    }))
    .pipe(gulp.dest('.'));
});
