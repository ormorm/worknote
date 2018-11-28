var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var reload = browserSync.reload;
var minify=require('gulp-minify-css');
//防止 scss 写到一半时,保存编译出错
function handleError(err) {
    console.log(err.toString());
    this.emit('end');
}
// scss编译后的css将注入到浏览器里实现更新
gulp.task('sass', function () {
    return gulp.src("assets/sass/*.scss")
        .pipe(sass()).on('error', handleError)
        .pipe(prefix())
        // .pipe(minify())
        .pipe(gulp.dest("assets/css/"))
        .pipe(reload({stream: true}));
});



// 静态服务器 + 监听 scss/html 文件
gulp.task('serve', ['sass'], function () {

    browserSync.init({
        server: "./"
    });
    gulp.watch("assets/img/*", ['buildImg']).on('error', handleError).on('change',reload);
    gulp.watch("assets/sass/*.scss", ['sass']).on('error', handleError).on('change',reload);
    // gulp.watch("assets/js/*/*.js",['buildJs']).on('change',reload);
    gulp.watch("html/*.html").on('error', handleError).on('change',reload);
});


gulp.task('default', ['serve']);

