module.exports = {
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  env: {
    browser: true,
    // "Enable all ECMAScript 6 features except for modules (this
    // automatically sets the ecmaVersion parser option to 6)."
    es6: true,
    webextensions: true,
  },
};
