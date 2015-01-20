var gulp = require("gulp");
var concat = require("gulp-concat");
var rev = require("gulp-rev");
var addSrc = require("gulp-add-src");
var htmlmin = require("gulp-htmlmin");
var download = require("gulp-download");

gulp.task("clean", function (next) {
  var del = require("del");

  del(["public"], next);

});

gulp.task("css", ["clean"], function () {
  var uncss = require("gulp-uncss");
  var glob = require("glob");
  var cssmin = require("gulp-cssmin");
  var stripCssComments = require("gulp-strip-css-comments");

  return gulp.src([
      "mockup/css/doc.css",
      "mockup/css/font-awesome.min.css"
    ])
    .pipe(uncss({
      html: glob.sync("mockup/**/*.html")
    }))
    .pipe(addSrc("mockup/css/style.css"))
    .pipe(addSrc("mockup/css/lexicon.css"))
    .pipe(stripCssComments())
    .pipe(concat("app.css"))
    .pipe(cssmin())
    .pipe(rev())
    .pipe(gulp.dest("public/css"))
    .pipe(rev.manifest())
    .pipe(gulp.dest("rev/css"));

});

gulp.task("download", ["clean"], function () {
  if(!process.env.INDEX_URL) return;
  return download(process.env.INDEX_URL)
    .pipe(gulp.dest("public"));
});

gulp.task("js", ["download"], function () {
  var fs = require("fs");
  var ngAnnotate = require("gulp-ng-annotate");
  var uglify = require("gulp-uglify");
  var replace = require("gulp-replace");
  var proposals = [
      { "title_cht" : "群眾募資", "title_eng" : "crowdfunding", "category_num" : 6},
      { "title_cht" : "閉鎖型公司", "title_eng" : "closelyheld", "category_num" : 5}
  ];

  if(process.env.INDEX_URL) {
    proposals = JSON.parse(fs.readFileSync(__dirname + "/public/proposals.json").toString());
  }
  proposals.forEach(function (proposal) {
    var title = proposal.title_eng;
    download("http://g0v.github.io/" + title + "-gitbook/content.json")
    .pipe(gulp.dest("public/" + title ));
  });

  return gulp.src("mockup/**/*.js")
    .pipe(replace(/\{\{proposals\}\}/, JSON.stringify(proposals)))
    .pipe(ngAnnotate({
      remove: true,
      add: true,
      single_quotes: true
    }))
    .pipe(concat("app.js"))
    .pipe(uglify())
    .pipe(rev())
    .pipe(gulp.dest("public"))
    .pipe(rev.manifest())
    .pipe(gulp.dest("rev/js"));

});

gulp.task("html", ["clean"], function () {

  return gulp.src("mockup/partials/*.html")
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(gulp.dest("public/partials"));

});

gulp.task("rev", ["css", "js"], function () {
  var revCollector = require('gulp-rev-collector');
  var htmlmin = require("gulp-htmlmin");

  return gulp.src(['rev/**/*.json', 'mockup/index.html'])
    .pipe(revCollector({
      replaceReved: true
    }))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(gulp.dest('.'));
});

gulp.task("image", ["clean"], function () {
  var imagemin = require('gulp-imagemin');
  var pngquant = require('imagemin-pngquant');

  return gulp.src("mockup/images/*")
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest("public/images"));

});


gulp.task("fonts", ["clean"], function () {
  return gulp.src("mockup/fonts/*")
    .pipe(gulp.dest("public/fonts"));

});

gulp.task("default", ["css", "js", "html", "image", "fonts", "rev"]);
