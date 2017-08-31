const fs = require('fs');
const path = require('path');
const glob = require('glob');
const postcss = require('postcss');
const less = require('postcss-less-engine');
const autoprefixer = require('autoprefixer');
const rucksack = require('rucksack-css');

const PLACEHOLDERS = {
  '@primary-color': '#999999',
  '@link-color': '#999999',
  '@outline-color': '#999999',
  '@btn-primary-bg': '#999999',
  '@input-hover-border-color': '#999999',
  '@process-default-color': '#999999',
  '@primary-1': '#999998',
  '@primary-2': '#999997',
  '@primary-5': '#999996',
  '@primary-6': '#999995',
  '@primary-7': '#999994',
};

const COMPUTED = {
  '@primary-5': '#b1b1b1',
  '@primary-7': '#858585',
}

const reducePlugin= postcss.plugin('reducePlugin', () => {
  const cleanRule = rule => {
    let removeRule = true;
    rule.walkDecls(decl => {
      let removeDecl = true;
      const placeholders = [
        ...Object.values(PLACEHOLDERS),
        ...Object.values(COMPUTED),
      ];
      for (var i = 0; i < placeholders.length; ++i) {
        const placeholder = placeholders[i];
        if (decl.value.includes(placeholder)) {
          removeRule = false;
          removeDecl = false;
          break;
        }
      }
      if (removeDecl) {
        // decl.remove();
      }
    });
    if (removeRule) {
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
  Object.keys(PLACEHOLDERS).forEach(key => {
    css += `${key}: ${PLACEHOLDERS[key]};\n`;
  });
  css += '\n';
  for (let i = 0; i < styles.length; ++i) {
    css += `@import "${styles[i]}";\n`;
  }
  // fs.writeFileSync('/tmp/style.less', css);
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
  let result = output.css;
  Object.keys(PLACEHOLDERS).forEach(key => {
    result = result.replace(new RegExp(PLACEHOLDERS[key], 'g'), key);
  });
  Object.keys(COMPUTED).forEach(key => {
    result = result.replace(new RegExp(COMPUTED[key], 'g'), key);
  });

  result = `
@import "./color/colors";

@primary-color: #999999;
@primary-1: color(~\`colorPalette("@{primary-color}", 1)\`);
@primary-2: color(~\`colorPalette("@{primary-color}", 2)\`);
@primary-5: color(~\`colorPalette("@{primary-color}", 5)\`);
@primary-6: @primary-color;
@primary-7: color(~\`colorPalette("@{primary-color}", 7)\`);
\n
  ` + result;

  fs.writeFileSync(path.resolve(__dirname, './style/index.less'), result);
}

generateCss();
