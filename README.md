# Static Site Generator

Uses for: [http://antonfisher.github.io](http://antonfisher.github.io)

## Features
* Static HTML generation (Index, Post, About pages)
* Markdown
* Nunjucks Templates for theming
* Gulp based
* RSS feed generator 

## Usage
* Create blog folder: `$mkdir myblog && cd myblog`
* Create _.gitignore_ file: `$echo 'static-site-generator'>.gitignore`
* Clone generator: `$git clone https://github.com/antonfisher/static-blog-generator.git`
* Go to generator folder: `$cd static-blog-generator`
* Install dependencies `$npm install`
* Run generator `$gulp` or `$./node_modules/gulp/bin/gulp.js`

## Release History
* 1.0.0 Initial release
    * Gulp tasks
    * HTML generator
    * About page
    * RSS feed generator
    * Config file
    * Themes

## ToDo
- [x] Config example
- [x] Themes images
- [x] Copy all theme files
- [ ] Post summary on index page
- [ ] Tags support
- [ ] 404 page
- [ ] Comments
- [ ] GA config
- [ ] Pagination

## License
Copyright (c) 2015 Anton Fisher <a.fschr@gmail.com>

MIT License. Free use and change.
