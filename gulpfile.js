var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var merge = require('merge-stream');
var minify = require('gulp-minify-css');
var Remarkable = require('remarkable');
var highlightJs = require('highlight.js');
var nunjucksRender = require('gulp-nunjucks-render');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var reload = browserSync.reload;

var markdown = new Remarkable({
    html: true,
    langPrefix: 'language-',
    linkify: true,
    typographer: true,
    xhtmlOut: true,
    highlight: function (str, lang) {
        if (lang && highlightJs.getLanguage(lang)) {
            try {
                return highlightJs.highlight(lang, str).value;
            } catch (err) {
                //--
            }
        }

        try {
            return highlightJs.highlightAuto(str).value;
        } catch (err) {
            //--
        }

        return '';
    }
});

var configFile = '../_config.json';
var config = {
    "theme": "default",
    "name": "{NAME}",
    "email": "{EMAIL}",
    "url": "http://{SITE}.com",
    "rssUUID": "{RSS-UUID}",
    "description": "{DESCRIPTION}"
};

try {
    config = JSON.parse(fs.readFileSync(configFile, {encoding: 'utf8'}));
} catch (e) {
    console.warn('WARNING: no config file:', configFile);
}

var postsSourcesPath = '../_posts';
var themePath = ('./themes/' + config.theme);

gulp.task('css', function () {
    var scssStream = gulp.src(themePath + '/scss/**/*.scss')
        .pipe(sass())
        .pipe(concat('scss'))
        .pipe(reload({stream: true}));

    var cssStream = gulp.src([
            './node_modules/normalize.css/normalize.css',
            './node_modules/highlight.js/styles/default.css'
        ])
        .pipe(concat('css'))
        .pipe(reload({stream: true}));

    return merge(scssStream, cssStream)
        .pipe(concat('all.min.css'))
        .pipe(minify())
        .pipe(gulp.dest('../css'))
        .pipe(reload({stream: true}));
});

gulp.task('renderer', function () {
    var formatDate = function (dateString) {
        return (new Date(dateString || +(new Date()))).toISOString().replace(/\.[0-9]+/, '');
    };

    var posts = fs.readdirSync(postsSourcesPath)
        .map(function (fileName) {
            var post;
            var fileContent = fs.readFileSync(path.join(postsSourcesPath, fileName), {encoding: 'utf8'});
            var match = ((new RegExp('^({(\\n(?!}).*)*\\n})((.|\\s)*)', 'g')).exec(fileContent) || []);
            var jsonHeader = match[1];
            var article = match[3];

            if (!jsonHeader) {
                console.warn('WARNING: no json header in:', fileName);
                return null;
            } else {
                try {
                    post = JSON.parse(jsonHeader);
                } catch (e) {
                    console.warn('WARNING: bad json header in:', fileName);
                    return null;
                }

                var requiredParams = ['title', 'date', 'image'];
                for (var i in requiredParams) {
                    if (!post[requiredParams[i]]) {
                        console.warn('WARNING: no "', requiredParams[i], '" json param in:', fileName);
                        return null;
                    }
                }
            }

            if (!article) {
                console.warn('WARNING: no article in:', fileName);
                return null;
            }

            post.article = markdown.render(article);
            post.datetimeISO = formatDate(post.date);
            post.link = [
                '/posts',
                post.date.replace(/-/g, '/'),
                post.title.toLowerCase().replace(/[^\w]/g, '-')
            ].join('/');
            post.uuid = post.link.replace(/\//g, '-');

            post.preview = post.article
                .replace(/\n/g, ' ')
                .replace(/.*<!-- preview -->(.*)<!-- \/preview -->.*/, '$1');

            post.previewIndexPade = post.preview.replace(
                /\.? *<\/p> *$/,
                '&hellip; <a href="' + post.link + '">Read more</a></p>'
            );

            // for google
            post.article = post.article
                .replace(/\n/g, ' ')
                .replace(
                    /(.*)<!-- preview -->(.*)<!-- \/preview -->(.*)/g,
                    '<span itemprop="headline">$2</span> <span itemprop="articleBody">$3</span>'
                );

            return post;
        })
        .filter(function (post) {
            return (post !== null);
        });

    rimraf.sync('../posts/*');

    gulp.src(themePath + '/resources/**/*')
        .pipe(gulp.dest('../resources/'))
        .pipe(reload({stream: true}));

    nunjucksRender.nunjucks.configure([themePath + '/templates']);

    posts.map(function (post) {
        return gulp.src(themePath + '/templates/pages/post.html')
            .pipe(nunjucksRender({
                config: config,
                post: post
            }))
            .pipe(rename('index.html'))
            .pipe(gulp.dest(path.join('..', post.link)))
            .pipe(reload({stream: true}));
    });

    gulp.src(themePath + '/templates/pages/about.html')
        .pipe(nunjucksRender({
            config: config
        }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('../about'))
        .pipe(reload({stream: true}));

    gulp.src(themePath + '/templates/pages/feed.xml')
        .pipe(nunjucksRender({
            config: config,
            nowDatetimeISO: formatDate(),
            posts: posts
        }))
        .pipe(rename('feed.xml'))
        .pipe(gulp.dest('../'))
        .pipe(reload({stream: true}));

    return gulp.src(themePath + '/templates/pages/index.html')
        .pipe(nunjucksRender({
            config: config,
            posts: posts
        }))
        .pipe(gulp.dest('../'))
        .pipe(reload({stream: true}));
});

gulp.task('default', ['css', 'renderer'], function () {
    browserSync({
        server: {
            baseDir: '../'
        }
    });

    gulp.watch('../_posts/*.md', ['renderer']);
    gulp.watch([themePath + '/**/*.html', themePath + '/**/*.xml', themePath + '/*.html'], ['renderer']);
    gulp.watch([themePath + '/scss/*.scss', './node_modules/normalize.css/normalize.css'], ['css']);
    gulp.watch(['**/*.html', '**/*.css', 'img/**/*'], {cwd: '../'}, reload);
});
