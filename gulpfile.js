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

const CONFIG_FILE = '../_config.json';
const POST_SOURCES_PATH = '../_posts';

function abort(err) {
  console.error(`ERROR: ${err}`);
  process.exit(1);
}

function urlify(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^(-*)|(-*)$/g, '');
}

// '2020-09-01' -> '2020-09-01T00:00:00Z'
function formatDateToISO(dateString = +new Date()) {
  return new Date(dateString).toISOString().replace(/\.[0-9]+/, '');
}

// '2020-09-01' -> '01 Sep 2020'
function formatDateToUTC(dateString = +new Date()) {
  return new Date(dateString).toUTCString().split(' ').slice(1, 4).join(' ');
}

let config;
try {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, {encoding: 'utf8'}));
} catch (e) {
  abort(`Config file "${CONFIG_FILE}" not found or filed to parse: ${e}`);
}

const THEME_PATH = '../_theme';

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
        console.error(`ERROR: failed to highlight: "${srt}" as "${lang}"`);
      }
    }

    try {
      return highlightJs.highlightAuto(str).value;
    } catch (err) {
      console.warn(`WARNING: failed to apply code auto-highlight: ${err}`);
    }

    return '';
  }
}).use(linkify);

nunjucksRender.setDefaults({
  path: [THEME_PATH + '/templates'],
  envOptions: {
    autoescape: false
  }
});

gulp.task('css', () => {
  const scssStream = gulp
    .src(THEME_PATH + '/scss/**/*.scss')
    .pipe(sass())
    .pipe(concat('scss'))
    .pipe(reload({stream: true}));

  const cssStream = gulp
    .src(['./node_modules/normalize.css/normalize.css', './node_modules/highlight.js/styles/default.css'])
    .pipe(concat('css'))
    .pipe(reload({stream: true}));

  return merge(cssStream, scssStream)
    .pipe(concat('all.min.css'))
    .pipe(cleanCss())
    .pipe(gulp.dest('../css'))
    .pipe(reload({stream: true}));
});

gulp.task('renderer', () => {
  const tagsMap = {};
  const posts = fs
    .readdirSync(POST_SOURCES_PATH)
    .reverse()
    .map((fileName) => {
      let post;
      const fileContent = fs.readFileSync(path.join(POST_SOURCES_PATH, fileName), {
        encoding: 'utf8'
      });
      const match = new RegExp('^({(\\n(?!}).*)*\\n})((.|\\s)*)', 'g').exec(fileContent) || [];
      const jsonHeader = match[1];
      const article = match[3];

      if (!jsonHeader) {
        abort(`No json header in: ${fileName}`);
      } else if (!article) {
        abort(`No article in: ${fileName}`);
      }

      try {
        post = JSON.parse(jsonHeader);
      } catch (e) {
        abort(`Bad json header in: ${fileName}, error: ${e}`);
      }

      const requiredParams = ['title', 'date'];
      for (let i in requiredParams) {
        if (!post[requiredParams[i]]) {
          abort(`No "${requiredParams[i]}" json param in: ${fileName}`);
        }
      }

      post.article = markdown.render(article);
      post.dateTimeISO = formatDateToISO(post.date);
      post.dateTimeUTC = formatDateToUTC(post.date);
      post.link = ['/posts', post.date.replace(/-/g, '/'), urlify(post.title)].join('/') + '/';
      post.uuid = post.link.replace(/\//g, '-').replace(/-$/, '');
      post.anchor = `${post.date}-${urlify(post.title)}`;
      post.imagePreview = post.imagePreview || post.image;

      post.preview = post.article.replace(/[\s\S]*<!-- preview -->([\s\S]*)<!-- \/preview -->[\s\S]*/g, '$1');

      if (post.article === post.preview) {
        post.previewIndexPage = post.article;
      } else {
        //TODO: move to template layer?
        post.previewIndexPage = post.preview.replace(
          /([\s\S]*)<\/p> */g,
          '$1&hellip; <a href="' + post.link + '">Read more</a></p>'
        );

        // for google
        post.article = post.article.replace(
          /([\s\S]*)<!-- preview -->([\s\S]*)<!-- \/preview -->([\s\S]*)/g,
          '<span itemprop="headline"><p>$2</p></span> <span itemprop="articleBody">$3</span>'
        );
      }

      post.tags = (post.tags ? post.tags.split(',') : []).map((tag) => {
        const obj = {
          title: tag,
          link: '/tags/' + urlify(tag) + '/'
        };

        tagsMap[tag] = tagsMap[tag] || obj;
        tagsMap[tag].posts = tagsMap[tag].posts || [];
        tagsMap[tag].posts.push(post);

        return obj;
      });

      return post;
    });

  rimraf.sync('../posts/*');
  rimraf.sync('../tags/*');

  gulp
    .src(THEME_PATH + '/resources/**/*')
    .pipe(gulp.dest('../resources/'))
    .pipe(reload({stream: true}));

  posts.map((post) => {
    gulp
      .src(THEME_PATH + '/templates/pages/post.html')
      .pipe(
        nunjucksRender({
          data: {
            title: post.title,
            config,
            post
          }
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
      gulp
        .src(THEME_PATH + '/templates/pages/posts.html')
        .pipe(
          nunjucksRender({
            data: {
              title: 'Tag: ' + tag.title,
              posts: tag.posts,
              config,
              tag
            }
          })
        )
        .pipe(rename('index.html'))
        .pipe(gulp.dest(path.join('..', tag.link)))
        .pipe(reload({stream: true}));
    }
  }

  tags = tags.sort((a, b) => (a.posts.length > b.posts.length ? -1 : 1));

  if (tags.length > 0) {
    gulp
      .src(THEME_PATH + '/templates/pages/tags.html')
      .pipe(
        nunjucksRender({
          data: {
            config,
            tags
          }
        })
      )
      .pipe(rename('index.html'))
      .pipe(gulp.dest('../tags'))
      .pipe(reload({stream: true}));
  }

  gulp
    .src(THEME_PATH + '/templates/pages/feed.xml')
    .pipe(
      nunjucksRender({
        data: {
          config,
          posts,
          nowDateTimeISO: formatDateToISO()
        }
      })
    )
    .pipe(rename('feed.xml'))
    .pipe(gulp.dest('../'))
    .pipe(reload({stream: true}));

  gulp
    .src(THEME_PATH + '/templates/pages/sitemap.xml')
    .pipe(
      nunjucksRender({
        data: {
          config,
          posts,
          nowDateTimeISO: formatDateToISO()
        }
      })
    )
    .pipe(rename('sitemap.xml'))
    .pipe(gulp.dest('../'))
    .pipe(reload({stream: true}));

  return gulp
    .src(THEME_PATH + '/templates/pages/posts.html')
    .pipe(
      nunjucksRender({
        data: {
          config,
          posts
        }
      })
    )
    .pipe(rename('index.html'))
    .pipe(gulp.dest('../'))
    .pipe(reload({stream: true}));
});

gulp.task('watch', () => {
  browserSync({
    server: {
      baseDir: '../'
    }
  });

  gulp.watch('../_posts/*.md', gulp.series('renderer'));
  gulp.watch([THEME_PATH + '/**/*.html', THEME_PATH + '/**/*.xml', THEME_PATH + '/*.html'], gulp.series('renderer'));
  gulp.watch([THEME_PATH + '/scss/*.scss', './node_modules/normalize.css/normalize.css'], gulp.series('css'));
  gulp.watch(['**/*.html', '**/*.css', 'img/**/*'], {cwd: '../'}, reload);
});

gulp.task('build', gulp.parallel('css', 'renderer'));

gulp.task('default', gulp.series('build', 'watch'));
