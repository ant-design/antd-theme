const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const cors = require('kcors');
const fs = require('fs');
const path = require('path');
const less = require('less');
const colorPalette = require('./color/colorPalette');

const app = new Koa();
const router = new Router();

function compile(variables) {
  const cssFile = path.resolve(__dirname, './index.less');
  const primaryColor = variables['@primary-color'];
  const colorMap = {
    '@primary-color': primaryColor,
    '@primary-1': colorPalette(primaryColor, 1),
    '@primary-2': colorPalette(primaryColor, 2),
    '@primary-5': colorPalette(primaryColor, 5),
    '@primary-6': primaryColor,
    '@primary-7': colorPalette(primaryColor, 7),
  }
  let css = fs.readFileSync(cssFile).toString();
  Object.keys(colorMap).forEach(key => {
    css = css.replace(new RegExp(key, 'g'), colorMap[key]);
  });
  return css;
}

router
  .get('/', (ctx, next) => {
    ctx.body = 'Hello World!';
  })
  .post('/compile', async (ctx) => {
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    ctx.set('Access-Control-Allow-Origin', '*')
    const { variables } = ctx.request.body;
    const css = compile(variables);
    // output
    ctx.body = css;
  })
  .options('*', async (ctx, next) => {
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    ctx.set('Access-Control-Allow-Origin', '*')
    ctx.status = 204
    await next()
  });

app
  .use(koaBody())
  .use(router.routes())
  .use(router.allowedMethods())
  .use(cors());

const port = process.env.NODE_ENV === 'production' ? 80 : 3000;
app.listen(port);
console.log(`Listening on http://0.0.0.0:${port}`);
