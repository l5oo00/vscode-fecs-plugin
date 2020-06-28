/**
 * @file: tseslint.js
 * @description ..
 */
const config = {
    extends: [
        require.resolve('@ecomfe/eslint-config'),
        require.resolve('@ecomfe/eslint-config/import'),
        require.resolve('@ecomfe/eslint-config/typescript')
    ],
    rules: {
        'comma-dangle': ['error', 'never'],

        'import/extensions': ['error', {
            json: 'always'
        }]
    },

    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx']
        },
        'import/resolver': {
            typescript: {}
        }
    }
}
module.exports = config;
