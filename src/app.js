const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const https = require('https');
const fs = require('fs');
const unzip = require('unzip');
const { promisify: py } = require('util');
const glob = require('glob');
const postcss = require('postcss');
const less = require('postcss-less-engine');
const autoprefixer = require('autoprefixer');
const rucksack = require('rucksack-css');

const app = new Koa();
const router = new Router();

const zipUrl = 'https://codeload.github.com/ant-design/ant-design/zip/master';

function download(url, dest) {
  const file = fs.createWriteStream(dest);
  return new Promise(resolve => {
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    });
  });
}

function extract(file) {
  return new Promise(resolve => {
    fs.createReadStream(file)
      .pipe(unzip.Extract({ path: '/tmp/antd' }))
      .on('close', resolve);
  });
}

async function compile(entry, variables) {
  const styles = await py(glob)('/tmp/antd/ant-design-master/components/*/style/index.less');
  styles.forEach(style => {
    py(fs.appendFile)(entry, `@import "${style}";\n`)
  });
  Object.keys(variables).forEach((key) => {
    py(fs.appendFile)(entry, `${key}: ${variables[key]};\n`);
  });
  const css = await py(fs.readFile)(entry)
  const output = await postcss([
    less({
      paths: ['/tmp/antd/ant-design-master/components/style']
    }),
    rucksack(),
    autoprefixer({
      browsers: ['last 2 versions', 'Firefox ESR', '> 1%', 'ie >= 8', 'iOS >= 8', 'Android >= 4'],
    }),
  ]).process(css.toString(), { parser: less.parser, from: entry });
  return output.css;
}

router
  .get('/', (ctx, next) => {
    ctx.body = 'Hello World!';
  })
  .post('/compile', async (ctx, next) => {
    const zipFile = '/tmp/ant-design.zip';
    // download repo
    await download(zipUrl, zipFile);
    await extract(zipFile);
    // compile
    const entry = '/tmp/antd/ant-design-master/components/style/index.less';
    const { variables } = ctx.request.body;
    const css = await compile(entry, variables);
    // output
    ctx.body = css;
  });

app
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods());

const port = process.env.NODE_ENV === 'production' ? 80 : 3000;
app.listen(port);
console.log(`Listening on http://0.0.0.0:${port}`);
