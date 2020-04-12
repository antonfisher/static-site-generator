const gulp = require('gulp');
const browserSync = require('browser-sync');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const merge = require('merge-stream');
const cleanCss = require('gulp-clean-css');
const {Remarkable} = require('remarkable');
const {linkify} = require('remarkable/linkify');
const highlightJs = require('highlight.js');
const nunjucksRender = require('gulp-nunjucks-render');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const reload = browserSync.reload;

const markdown = new Remarkable({
    html: true,
    langPrefix: 'language-',
    typographer: true,
    xhtmlOut: true,
    highlight: (str, lang) => {
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
            console.warn('WARNING: failed to apply code auto-highlight:', err);
        }

        return '';
    },
}).use(linkify);

const configFile = '../_config.json';

let config;
try {
    config = JSON.parse(fs.readFileSync(configFile, {encoding: 'utf8'}));
} catch (e) {
    // TODO function
    console.error('ERROR: no config file:', configFile);
    process.exit(1);
}

const postsSourcesPath = '../_posts';
const themePath = './themes/' + config.theme;

nunjucksRender.setDefaults({
    path: [themePath + '/templates'],
    envOptions: {
        autoescape: false,
    },
});

gulp.task('css', () => {
    const scssStream = gulp
        .src(themePath + '/scss/**/*.scss')
        .pipe(sass())
        .pipe(concat('scss'))
        .pipe(reload({stream: true}));

    const cssStream = gulp
        .src([
            './node_modules/normalize.css/normalize.css',
            './node_modules/highlight.js/styles/default.css',
        ])
        .pipe(concat('css'))
        .pipe(reload({stream: true}));

    return merge(scssStream, cssStream)
        .pipe(concat('all.min.css'))
        .pipe(cleanCss())
        .pipe(gulp.dest('../css'))
        .pipe(reload({stream: true}));
});

gulp.task('renderer', () => {
    const formatDate = (dateString) =>
        new Date(dateString || +new Date()).toISOString().replace(/\.[0-9]+/, '');

    const urlify = (str) =>
        (str || '')
            .toLowerCase()
            .replace(/[^\w]/g, '-')
            .replace(/--+/g, '-')
            .replace(/^(-*)|(-*)$/g, '');

    const tagsMap = {};
    const posts = fs
        .readdirSync(postsSourcesPath)
        .reverse()
        .map((fileName) => {
            let post;
            const fileContent = fs.readFileSync(path.join(postsSourcesPath, fileName), {
                encoding: 'utf8',
            });
            const match =
                new RegExp('^({(\\n(?!}).*)*\\n})((.|\\s)*)', 'g').exec(fileContent) || [];
            const jsonHeader = match[1];
            const article = match[3];

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

                const requiredParams = ['title', 'date', 'image'];
                for (let i in requiredParams) {
                    if (!post[requiredParams[i]]) {
                        console.error(
                            'WARNING: no "',
                            requiredParams[i],
                            '" json param in:',
                            fileName
                        );
                        process.exit(1);
                        //return null;
                    }
                }
            }

            if (!article) {
                console.error('WARNING: no article in:', fileName);
                process.exit(1);
                //return null;
            }

            post.article = markdown.render(article);
            post.datetimeISO = formatDate(post.date);
            post.link =
                ['/posts', post.date.replace(/-/g, '/'), urlify(post.title)].join('/') + '/';
            post.uuid = post.link.replace(/\//g, '-').replace(/-$/, '');
            post.imagePreview = post.imagePreview || post.image;

            post.preview = post.article.replace(
                /[\s\S]*<!-- preview -->([\s\S]*)<!-- \/preview -->[\s\S]*/g,
                '$1'
            );

            post.previewIndexPage = post.preview.replace(
                /([\s\S]*)<\/p> */g,
                '$1&hellip; <a href="' + post.link + '">Read more</a></p>'
            );

            // for google
            post.article = post.article.replace(
                /([\s\S]*)<!-- preview -->([\s\S]*)<!-- \/preview -->([\s\S]*)/g,
                '<span itemprop="headline"><p>$2</p></span> <span itemprop="articleBody">$3</span>'
            );

            post.tags = (post.tags ? post.tags.split(',') : []).map((tag) => {
                const obj = {
                    title: tag,
                    link: '/tags/' + urlify(tag) + '/',
                };

                tagsMap[tag] = tagsMap[tag] || obj;
                tagsMap[tag].posts = tagsMap[tag].posts || [];
                tagsMap[tag].posts.push(post);

                return obj;
            });

            return post;
        })
        .filter((post) => post !== null);

    rimraf.sync('../posts/*');
    rimraf.sync('../tags/*');

    gulp.src(themePath + '/resources/**/*')
        .pipe(gulp.dest('../resources/'))
        .pipe(reload({stream: true}));

    posts.map((post) => {
        gulp.src(themePath + '/templates/pages/post.html')
            .pipe(
                nunjucksRender({
                    data: {
                        title: post.title,
                        config,
                        post,
                    },
                })
            )
            .pipe(rename('index.html'))
            .pipe(gulp.dest(path.join('..', post.link)))
            .pipe(reload({stream: true}));
    });

    let tags = [];
    for (let key in tagsMap) {
        if (tagsMap.hasOwnProperty(key)) {
            const tag = tagsMap[key];

            tags.push(tag);
            gulp.src(themePath + '/templates/pages/posts.html')
                .pipe(
                    nunjucksRender({
                        data: {
                            title: 'Tag: ' + tag.title,
                            posts: tag.posts,
                            config,
                            tag,
                        },
                    })
                )
                .pipe(rename('index.html'))
                .pipe(gulp.dest(path.join('..', tag.link)))
                .pipe(reload({stream: true}));
        }
    }

    tags = tags.sort((a, b) => (a.posts.length > b.posts.length ? -1 : 1));

    gulp.src(themePath + '/templates/pages/tags.html')
        .pipe(
            nunjucksRender({
                data: {
                    config,
                    tags,
                },
            })
        )
        .pipe(rename('index.html'))
        .pipe(gulp.dest('../tags'))
        .pipe(reload({stream: true}));

    gulp.src(themePath + '/templates/pages/feed.xml')
        .pipe(
            nunjucksRender({
                data: {
                    config,
                    posts,
                    nowDatetimeISO: formatDate(),
                },
            })
        )
        .pipe(rename('feed.xml'))
        .pipe(gulp.dest('../'))
        .pipe(reload({stream: true}));

    gulp.src(themePath + '/templates/pages/sitemap.xml')
        .pipe(
            nunjucksRender({
                data: {
                    config,
                    posts,
                    nowDatetimeISO: formatDate(),
                },
            })
        )
        .pipe(rename('sitemap.xml'))
        .pipe(gulp.dest('../'))
        .pipe(reload({stream: true}));

    return gulp
        .src(themePath + '/templates/pages/posts.html')
        .pipe(
            nunjucksRender({
                data: {
                    config,
                    posts,
                },
            })
        )
        .pipe(rename('index.html'))
        .pipe(gulp.dest('../'))
        .pipe(reload({stream: true}));
});

gulp.task('default', ['css', 'renderer'], () => {
    browserSync({
        server: {
            baseDir: '../',
        },
    });

    gulp.watch('../_posts/*.md', ['renderer']);
    gulp.watch(
        [themePath + '/**/*.html', themePath + '/**/*.xml', themePath + '/*.html'],
        ['renderer']
    );
    gulp.watch([themePath + '/scss/*.scss', './node_modules/normalize.css/normalize.css'], ['css']);
    gulp.watch(['**/*.html', '**/*.css', 'img/**/*'], {cwd: '../'}, reload);
});
