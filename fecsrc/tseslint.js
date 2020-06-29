/**
 * @file: tseslint.js
 * @description ..
 */
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
        'indent': [
            'error',
            4,
            {
                SwitchCase: 1
            }
        ],
        'indent-legacy': 'off',
        'generator-star-spacing': [
            'error',
            {
                before: false,
                after: true
            }
        ],
        'array-bracket-spacing': [
            'error',
            'never'
        ],
        'arrow-parens': [
            'error',
            'as-needed'
        ],
        'no-console': 'warn',
        'no-constant-condition': 'warn',
        'comma-dangle': [
            'error',
            'never'
        ],
        'no-debugger': 'error',
        'no-dupe-keys': 'warn',
        'no-empty-character-class': 'error',
        'no-ex-assign': 'error',
        'no-extra-boolean-cast': 'warn',
        'no-func-assign': 'warn',
        'no-inner-declarations': 'warn',
        'no-invalid-regexp': 'error',
        'no-negated-in-lhs': 'error',
        'no-obj-calls': 'error',
        'no-sparse-arrays': 'error',
        'no-unreachable': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'error',
        'curly': [
            'error',
            'all'
        ],
        'eqeqeq': [
            'error',
            'allow-null'
        ],
        'guard-for-in': 'warn',
        'no-else-return': 'warn',
        'no-labels': [
            'warn',
            {
                allowLoop: true
            }
        ],
        'no-eval': 'warn',
        'no-extend-native': 'error',
        'no-extra-bind': 'warn',
        'no-implied-eval': 'warn',
        'no-iterator': 'error',
        'no-irregular-whitespace': 'warn',
        'no-lone-blocks': 'warn',
        'no-loop-func': 'warn',
        'no-multi-str': 'warn',
        'no-native-reassign': 'error',
        'no-new-wrappers': 'error',
        'no-octal': 'warn',
        'no-octal-escape': 'warn',
        'no-proto': 'error',
        'no-redeclare': 'warn',
        'no-self-compare': 'error',
        'no-unneeded-ternary': 'error',
        'no-with': 'warn',
        'radix': 'error',
        'wrap-iife': [
            'error',
            'any'
        ],
        'no-delete-var': 'warn',
        'no-dupe-args': 'error',
        'no-duplicate-case': 'error',
        'no-label-var': 'warn',
        'no-shadow-restricted-names': 'error',
        'no-undef': 'error',
        'no-undef-init': 'warn',
        // 'no-unused-vars': [
        //     'warn',
        //     {
        //         vars: 'local',
        //         args: 'none'
        //     }
        // ],
        'no-use-before-define': [
            'error',
            'nofunc'
        ],
        'brace-style': [
            'warn',
            'stroustrup',
            {}
        ],
        'comma-spacing': [
            'error',
            {
                before: false,
                after: true
            }
        ],
        'comma-style': [
            'error',
            'last'
        ],
        'new-parens': 'warn',
        'no-array-constructor': 'error',
        'no-multi-spaces': [
            'error',
            {
                exceptions: {
                    Property: true,
                    BinaryExpression: true,
                    VariableDeclarator: true
                }
            }
        ],
        'no-new-object': 'error',
        'no-spaced-func': 'error',
        'no-trailing-spaces': 'error',
        'no-extra-parens': 'off',
        'no-mixed-spaces-and-tabs': 'error',
        'one-var': [
            'error',
            'never'
        ],
        'operator-linebreak': [
            'error',
            'before'
        ],
        'quotes': [
            'error',
            'single'
        ],
        // 'semi': [
        //     'error',
        //     'always'
        // ],
        'semi-spacing': 'error',
        'keyword-spacing': 'error',
        'key-spacing': [
            'error',
            {
                beforeColon: false,
                afterColon: true
            }
        ],
        'space-before-function-paren': [
            'error',
            {
                anonymous: 'always',
                named: 'never'
            }
        ],
        'space-before-blocks': [
            'error',
            'always'
        ],
        'computed-property-spacing': [
            'error',
            'never'
        ],
        'space-in-parens': [
            'error',
            'never'
        ],
        'space-unary-ops': 'warn',
        'spaced-comment': [
            'error',
            'always',
            {
                exceptions: [
                    '-',
                    '+',
                    '\''
                ],
                block: {
                    balanced: true
                }
            }
        ],
        'max-nested-callbacks': [
            'warn',
            3
        ],
        'max-depth': [
            'warn',
            6
        ],
        'max-len': [
            'error',
            120,
            4,
            {
                ignoreUrls: true,
                ignoreComments: true
            }
        ],
        'max-params': [
            'warn',
            6
        ],
        'space-infix-ops': 'error',
        'dot-notation': [
            'error',
            {
                allowKeywords: true,
                allowPattern: '^catch$'
            }
        ],
        'arrow-spacing': 'error',
        'constructor-super': 'error',
        'no-confusing-arrow': [
            'error',
            {
                allowParens: true
            }
        ],
        'no-class-assign': 'warn',
        'no-const-assign': 'error',
        'no-dupe-class-members': 'warn',
        'no-this-before-super': 'warn',
        'no-var': 'warn',
        'no-duplicate-imports': 'warn',
        'prefer-rest-params': 'error',
        'unicode-bom': 'warn',
        'max-statements-per-line': 'error',
        'no-useless-constructor': 'warn',

        // import

        'import/no-unresolved': 'error',
        'import/named': 'error',
        'import/default': 'error',
        'import/namespace': 'off',
        'import/no-restricted-paths': 'off',
        'import/no-absolute-path': 'error',
        'import/no-dynamic-require': 'warn',
        'import/no-internal-modules': 'off',
        'import/no-webpack-loader-syntax': 'warn',
        'import/export': 'error',
        'import/no-named-as-default': 'off',
        'import/no-named-as-default-member': 'error',
        'import/no-deprecated': 'error',
        'import/no-extraneous-dependencies': 'off',
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
        'import/no-named-default': 'error',

        // typescript

        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': [
            'error',
            {
                'default': 'array-simple',
                'readonly': 'array-simple'
            }
        ],
        '@typescript-eslint/await-thenable': 'warn',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-types': 'error',
        '@typescript-eslint/naming-convention': 'error',
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-member-accessibility': ['error', {
            accessibility: 'no-public'
        }],
        'func-call-spacing': 'off',
        '@typescript-eslint/func-call-spacing': 'error',
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/member-delimiter-style': [
            'error',
            {
                multiline: {
                    delimiter: 'semi',
                    requireLast: true
                },
                singleline: {
                    delimiter: 'comma',
                    requireLast: false
                }
            }
        ],
        '@typescript-eslint/member-ordering': 'off',
        '@typescript-eslint/no-array-constructor': 'error',
        'no-empty-function': 'off',
        '@typescript-eslint/no-empty-function': 'error',
        '@typescript-eslint/no-empty-interface': 'warn',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-extra-parens': 'off',
        '@typescript-eslint/no-extraneous-class': 'error',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-for-in-array': 'error',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/consistent-type-assertions': 'error',
        '@typescript-eslint/no-parameter-properties': 'error',
        '@typescript-eslint/no-require-imports': 'error',
        '@typescript-eslint/no-this-alias': 'error',
        '@typescript-eslint/no-type-alias': 'off',
        '@typescript-eslint/no-unnecessary-qualifier': 'error',
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {vars: 'all', args: 'after-used', ignoreRestSiblings: true}
        ],
        '@typescript-eslint/no-use-before-define': 'error',
        '@typescript-eslint/no-useless-constructor': 'error',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/prefer-for-of': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-includes': 'warn',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/prefer-readonly': 'error',
        '@typescript-eslint/prefer-regexp-exec': 'warn',
        '@typescript-eslint/prefer-string-starts-ends-with': 'error',
        '@typescript-eslint/promise-function-async': 'off',
        '@typescript-eslint/require-array-sort-compare': 'off',
        '@typescript-eslint/restrict-plus-operands': 'warn',
        'semi': 'off',
        '@typescript-eslint/semi': 'error',
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/triple-slash-reference': 'error',
        '@typescript-eslint/type-annotation-spacing': 'error',
        '@typescript-eslint/unbound-method': 'off',
        '@typescript-eslint/unified-signatures': 'warn',
        // 和TS的规则冲突
        'require-await': 'off'

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
