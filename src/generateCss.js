const fs = require('fs');
const path = require('path');
const glob = require('glob');
const postcss = require('postcss');
const less = require('postcss-less-engine');
const autoprefixer = require('autoprefixer');
const rucksack = require('rucksack-css');

const PLACEHOLDER = '#999999';

const reducePlugin= postcss.plugin('reducePlugin', () => {
  const cleanRule = rule => {
    let remove = true;
    rule.walkDecls(decl => {
      if (decl.value.includes(PLACEHOLDER)) {
        remove = false;
      } else {
        decl.remove();
      }
    });
    if (remove) {
      rule.remove();
      rule.removed = true;
    }
  }
  return css => {
    css.walkAtRules(atRule => {
      let remove = true;
      atRule.walkRules(rule => {
        cleanRule(rule);
        if (!rule.removed) {
          remove = false
        }
      });
      if (remove) {
        atRule.remove();
      }
    });

    css.walkRules(cleanRule);

    css.walkComments(c => c.remove());
  }
});

async function generateCss() {
  const antd = path.resolve(__dirname, '../ant-design');
  const entry = path.join(antd, 'components/style/index.less');
  let css = fs.readFileSync(entry).toString();
  const styles = glob.sync(path.join(antd, 'components/*/style/index.less'));
  css += '\n';
  css += `@primary-color: ${PLACEHOLDER};\n`;
  css += '\n';
  for (let i = 0; i < styles.length; ++i) {
    css += `@import "${styles[i]}";\n`;
  }
  const output = await postcss([
    less({
      paths: [path.join(antd, 'components/style')]
    }),
    rucksack(),
    autoprefixer({
      browsers: ['last 2 versions', 'Firefox ESR', '> 1%', 'ie >= 8', 'iOS >= 8', 'Android >= 4'],
    }),
    reducePlugin,
  ]).process(css, { parser: less.parser, from: entry });
  fs.writeFileSync(path.resolve(__dirname, './style.css'), output.css);
}

generateCss();
