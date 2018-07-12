/**
 * @file: tslint.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-07-11 18:16:48
 * @last modified by: yanglei07
 * @last modified time: 2018-07-12 09:40:41
 */

/* global  */
'use strict';
const osLib = require('os');
const pathLib = require('path');
const fsLib = require('fs');

const tslint = require('tslint');
const errLib = require('./error.js');

function lint(code, filePath, fix = false) {
    const options = {
        fix,
        formatter: 'json'
    };
    const linter = new tslint.Linter(options);
    const configuration = tslint.Configuration.findConfiguration(null, filePath).results;

    linter.lint(filePath, code, configuration);

    return linter.getResult();
}

exports.check = (code, filePath) => {
    const result = lint(code, filePath);

    const errors = result.failures.map(error => {
        return errLib.format(
            error.startPosition.lineAndCharacter.line + 1,
            error.startPosition.lineAndCharacter.character + 1,
            error.ruleSeverity === 'error' ? 2 : 1,
            error.failure,
            error.ruleName,
            'tslint',
            error.endPosition.lineAndCharacter.line + 1,
            error.endPosition.lineAndCharacter.character + 1
        );
    });

    return Promise.resolve(errors);
};

exports.format = (code, filePath) => {
    const id = Math.random().toString(36)
        .substr(2, 10);
    const fileName = 'vscode-fecs-plugin-' + id + '-' + pathLib.basename(filePath);
    const tmpDir = osLib.tmpdir();
    const tmpFilePath = pathLib.join(tmpDir, fileName);

    // tslint fix 时会修改源文件， 这里用个临时文件李代桃僵
    fsLib.writeFileSync(tmpFilePath, code, {encoding: 'utf8'});
    lint(code, tmpFilePath, true); // 这一步会自动将格式化后的文件内容写入到临时文件里
    const formatedCode = fsLib.readFileSync(tmpFilePath, 'utf8');

    fsLib.unlinkSync(tmpFilePath);

    return Promise.resolve(formatedCode);
};
