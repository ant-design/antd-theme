const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const cors = require('kcors');
const fs = require('fs');
const path = require('path');

const app = new Koa();
const router = new Router();

const PLACEHOLDER = '#999999';

function compile(variables) {
  const cssFile = path.resolve(__dirname, './style.css');
  const css = fs.readFileSync(cssFile).toString();
  return css.replace(/#999999/g, variables['@primary-color']);
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
