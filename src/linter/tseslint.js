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
const errLib = require('./error.js');

const baseConfig = require('../../fecsrc/tseslint.js');

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

        // 以下代码没用， 暂时注释
        // options.settings = options.settings || {};
        // options.settings['import/resolver'] = options.settings['import/resolver'] || {};
        // options.settings['import/resolver']['typescript'] = options.settings['import/resolver']['typescript'] || {};
        // options.settings['import/resolver']['typescript']['directory'] = tsConfigFilePath;
    }
    const eslint = new CLIEngine(options);
    let report = eslint.executeOnText(code, filePath);
    return report.results[0];

}

exports.check = (code, filePath) => {
    const result = lint(code, filePath);

    const errors = result.messages.map(msg => {
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

exports.format = (code, filePath) => {
    const result = lint(code, filePath, true);
    return Promise.resolve(result.output || code);
};
