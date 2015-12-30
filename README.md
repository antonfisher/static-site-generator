# Static Site Generator

Markdown based static blog generator.
Uses for: [http://antonfisher.com](http://antonfisher.com)

## Features
* Static HTML generation (Index, Posts, About pages)
* Markdown for posts
* Nunjucks Templates for theming
* Gulp based
* RSS feed generator.

## Usage
* Create blog folder:
    `$ mkdir myblog && cd myblog`
* Create _.gitignore_ file:
    `$ echo 'static-site-generator'>.gitignore`
* Clone generator:
    `$ git clone https://github.com/antonfisher/static-blog-generator.git`
* Copy config file:
    `$ cp static-blog-generator/_config.example.json _config.json`
* Configure:
    `$ vim _config.json`
* Go to generator folder:
    `$ cd static-blog-generator`
* Install dependencies
    `$ npm install`
* Run generator
    `$ gulp` or `$ ./node_modules/gulp/bin/gulp.js`.
    
## Configuration
File `_config.json`:
``` json
{
  "theme": "default",
  "name": "{NAME}",
  "email": "{EMAIL}",
  "url": "{SITE}.com",
  "rssUUID": "{RSS-UUID}",
  "description": "{DEFAULT META DESCRIPTION}"
}
```

## Release History
* 1.0.0 Initial release
    * Gulp tasks
    * HTML generator
    * About page
    * RSS feed generator
    * Config file
    * Themes.

## ToDo
- [x] Config example
- [x] Themes images
- [x] Copy all theme files
- [x] Post summary on index page
- [x] GA config
- [x] Host in config
- [x] Generate meta
- [x] Comments
- [ ] Tags support
- [ ] Comments
- [ ] Pagination
- [ ] Update default theme
- [ ] Sitemap
- [ ] Check same posts links
- [ ] 404 page

## License
Copyright (c) 2015 Anton Fisher <a.fschr@gmail.com>

MIT License. Free use and change.
