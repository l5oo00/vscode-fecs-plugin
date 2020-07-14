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
const config = require('../config.js');
const errLib = require('./error.js');

const tsConfigFilePathCache = [];
const tsConfigName = 'tsconfig.json';

function fixBaseConfig() {
    const extraFileExtensions = baseConfig.parserOptions.extraFileExtensions || [];
    const vueLikeExt = config.vueLikeExt.map(ext => `.${ext}`);
    const uniqList = new Set([...extraFileExtensions, ...vueLikeExt]);
    baseConfig.parserOptions.extraFileExtensions = [...uniqList];
}
fixBaseConfig();

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

function lint(code, filePath, fix = false, ctx) {
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
        // vue 类文件做了拆解， filePath 是个虚拟的路径， 这里优先使用真实路径
        return execLint(options, code, ctx.filePath || filePath);
    }
    catch (ex) {
        // 用户自定义的  .eslintrc 文件中有其他 plugin 时， 会失败， 这里修正下， 改为不使用用户的 .eslintrc 文件
        if (ex.code === 'MODULE_NOT_FOUND') {
            options.useEslintrc = false;
            return execLint(options, code, ctx.filePath || filePath);
        }
        throw ex;
    }

}

exports.check = (oriCode, filePath, ctx) => {
    return new Promise(r => {
        const {code, disableErrors} = ignoreGlobalEslintDisalbe(oriCode, filePath);

        const result = lint(code, filePath, false, ctx);

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

        r(errors);
    });
};

exports.format = (oriCode, filePath, ctx) => {
    return new Promise(r => {
        const {code} = ignoreGlobalEslintDisalbe(oriCode, filePath);
        const result = lint(code, filePath, true, ctx);
        r(result.output || code);
    });
};
