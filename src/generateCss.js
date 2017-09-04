const fs = require('fs');
const path = require('path');
const glob = require('glob');
const postcss = require('postcss');
const less = require('postcss-less-engine');

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
  '@slider-0': '#d6d6d6',
  '@slider-1': '#cccccc',
  '@slider-2': 'rgba(153, 153, 153, 0.2)',
  '@slider-3': '#c2c2c2',
}

const reducePlugin= postcss.plugin('reducePlugin', () => {
  const cleanRule = rule => {
    let removeRule = true;
    rule.walkDecls(decl => {
      if (
        !decl.prop.includes('color') &&
        !decl.prop.includes('background') &&
        !decl.prop.includes('border') &&
        !decl.prop.includes('box-shadow')
      ) {
        decl.remove();
      } else {
        removeRule = false;
      }
    });
    if (removeRule) {
      rule.remove();
    }
  }
  return css => {
    css.walkAtRules(atRule => {
      atRule.remove();
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
    reducePlugin,
  ]).process(css, { parser: less.parser, from: entry });
  let result = output.css;
  Object.keys(PLACEHOLDERS).forEach(key => {
    result = result.replace(new RegExp(PLACEHOLDERS[key], 'g'), key);
  });
  Object.keys(COMPUTED).forEach(key => {
    result = result.replace(new RegExp(COMPUTED[key], 'g'), key);
  });

  fs.writeFileSync(path.resolve(__dirname, './index.less'), result);
}

generateCss();
