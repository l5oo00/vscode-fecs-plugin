/**
 * @file: tseslint.js
 * @description ..
 */
const baseRules = require('./tseslint-config-rules/base');
const strictRules = require('./tseslint-config-rules/strict');
const importRules = require('./tseslint-config-rules/import');
const typescriptRules = require('./tseslint-config-rules/typescript');

const config = {
    files: ['*.ts', '*.tsx'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        },
        project: './tsconfig.json'
    },
    plugins: [
        'import',
        '@typescript-eslint'
    ],
    env: {
        browser: true,
        node: true,
        es6: true
    },
    rules: {
        ...baseRules,
        ...strictRules,
        ...importRules,
        ...typescriptRules
    },

    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx']
        },
        'import/resolver': {
            typescript: {}
        }
    }
};
module.exports = config;
