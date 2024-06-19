/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting',
    'plugin:vue/base',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },

  rules: {
    'vue/valid-v-slot': ['error', { allowModifiers: true }],
    'vue/valid-attribute-name': 'off',
    'vue/multi-word-component-names': 'off'
  }
}
