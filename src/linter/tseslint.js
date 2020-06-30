/**
 * @file: tseslint.js
 * @author: yanglei07
 * @description ..
 */

/* global  */
'use strict';
const nodePathLib = require('path');
const nodeFsLib = require('fs');

const {CLIEngine} = require('eslint');

const baseConfig = require('../../fecsrc/tseslint.js');
const {ignoreGlobalEslintDisalbe} = require('../util.js');
const errLib = require('./error.js');

const tsConfigFilePathCache = [];
const tsConfigName = 'tsconfig.json';

function getTsConfigFilePath(filePath) {
    if (tsConfigFilePathCache.length) {
        for (const item of tsConfigFilePathCache) {
            if (filePath.startsWith(item)) {
                return nodePathLib.resolve(item, tsConfigName);
            }
        }
    }

    const pathArr = filePath.split(nodePathLib.sep);

    // 删除当地文件名
    pathArr.pop();

    while (pathArr.length) {
        const dirPath = pathArr.join(nodePathLib.sep);
        const configPath = nodePathLib.resolve(dirPath, tsConfigName);
        if (nodeFsLib.existsSync(configPath)) {
            tsConfigFilePathCache.push(dirPath);
            return configPath;
        }

        pathArr.pop();
    }

    return '';
}

function execLint(options, code, filePath) {
    const eslint = new CLIEngine(options);
    let report = eslint.executeOnText(code, filePath);
    return report.results[0];
}

function lint(code, filePath, fix = false) {
    let options = {
        baseConfig,
        fix
    };

    const tsConfigFilePath = getTsConfigFilePath(filePath);
    if (tsConfigFilePath) {
        options.parserOptions = {
            ...(options.parserOptions || {}),
            project: tsConfigFilePath
        };
    }

    try {
        return execLint(options, code, filePath);
    }
    catch (ex) {
        // 用户自定义的  .eslintrc 文件中有其他 plugin 时， 会失败， 这里修正下， 改为不使用用户的 .eslintrc 文件
        if (ex.message && ex.message.toLowerCase().includes('failed to load plugin ')) {
            options.useEslintrc = false;
            return execLint(options, code, filePath);
        }
    }

}

exports.check = (oriCode, filePath) => {
    const {code, disableErrors} = ignoreGlobalEslintDisalbe(oriCode, filePath);

    const result = lint(code, filePath);

    const errors = (result.messages.concat(disableErrors)).map(msg => {
        return errLib.format(
            msg.line,
            msg.column,
            msg.severity,
            msg.message,
            msg.ruleId,
            'eslint',
            msg.endLine,
            msg.endColumn
        );
    });

    return Promise.resolve(errors);
};

exports.format = (oriCode, filePath) => {
    const {code} = ignoreGlobalEslintDisalbe(oriCode, filePath);
    const result = lint(code, filePath, true);
    return Promise.resolve(result.output || code);
};
