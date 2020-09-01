/**
 * @file: import.js
 * @description https://github.com/ecomfe/eslint-config/blob/master/import/index.js
 */

module.exports = {
    'import/no-unresolved': 'off',
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'off',
    'import/no-restricted-paths': 'off',
    'import/no-absolute-path': 'error',
    'import/no-dynamic-require': 'warn',
    'import/no-internal-modules': 'off',
    'import/no-webpack-loader-syntax': 'warn',
    'import/export': 'error',
    // 'import/no-named-as-default': 'off',
    'import/no-named-as-default-member': 'error',
    'import/no-deprecated': 'error',
    // 'import/no-extraneous-dependencies': 'off',
    'import/no-mutable-exports': 'off',
    'import/unambiguous': 'error',
    'import/no-commonjs': 'warn',
    'import/no-amd': 'warn',
    'import/no-nodejs-modules': 'off',
    'import/first': 'error',
    'import/no-duplicates': 'error',
    'import/no-namespace': 'off',
    'import/extensions': [
        'error',
        {
            js: 'never',
            jsx: 'never,',
            ts: 'never',
            tsx: 'never,',
            es: 'never',
            json: 'always'
        }
    ],
    'import/order': [
        'warn',
        {
            groups: [
                'builtin',
                'external',
                'internal',
                'parent',
                'sibling',
                'index'
            ]
        }
    ],
    'import/newline-after-import': 'error',
    'import/prefer-default-export': 'off',
    'import/max-dependencies': 'off',
    'import/no-unassigned-import': 'off',
    'import/no-named-default': 'error'
};
