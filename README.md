# Markdown based static site generator

Used for: [https://antonfisher.com](https://antonfisher.com)

## Usage

Create site and configure:

```bash
mkdir my-site
cd my-site
echo 'static-site-generator'>.gitignore
git clone git@github.com:antonfisher/static-site-generator.git
cd static-site-generator
npm install
cd -
cp static-site-generator/_config.example.json _config.json
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
