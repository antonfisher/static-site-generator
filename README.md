# Markdown based static blog generator

Used for: [https://antonfisher.com](https://antonfisher.com)

## Usage

Create blog and configure:

```bash
mkdir myblog
cd myblog
echo 'static-site-generator'>.gitignore
git clone https://github.com/antonfisher/static-blog-generator.git
cd static-blog-generator
npm install
cd -
cp static-blog-generator/_config.example.json _config.json
vim _config.json
```

Development:

```bash
npm start
```

Build:

```bash
npm run build
```

## ToDo

- [ ] Pagination (?)
- [ ] Check same posts links
- [ ] 404 page

## License

Copyright (c) 2015 Anton Fisher <a.fschr@gmail.com>

MIT License.
