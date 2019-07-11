/**
 * @file: tseslint.js
 * @author: yanglei07
 * @description ..
 */

/* global  */
'use strict';
const osLib = require('os');
const pathLib = require('path');
const fsLib = require('fs');

const {CLIEngine} = require('eslint');
const errLib = require('./error.js');
const config = require('../config.js');

const baseConfig = require('../../fecsrc/tseslint.json');

function lint(code, filePath, fix = false) {
    let options = {
        baseConfig,
        useEslintrc: false,
        fix
    };
    if (config.tseslintConfigPath && fsLib.existsSync(config.tseslintConfigPath)) {
        options.configFile = config.tseslintConfigPath;
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
