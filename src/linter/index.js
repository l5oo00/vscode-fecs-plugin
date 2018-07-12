/**
 * @file: index.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-07-11 17:29:4
 * @last modified by: yanglei07
 * @last modified time: 2018-07-11 18:31:19
 */

/* global  */

'use strict';
const util = require('../util.js');

const fecs = require('./fecs.js');
const tslint = require('./tslint.js');

const linterMap = new Map();
function addLinter(extList, linter) {
    extList.forEach(ext => linterMap.set(ext, linter));
}
addLinter(['ts', 'tsx'], tslint);

function getLinter(filePath) {
    const ext = util.getFileExtName(filePath);
    return linterMap.get(ext) || fecs;
}

function check(code, filePath) {
    const linter = getLinter(filePath);
    return linter.check(code, filePath);
}

function format(code, filePath) {
    const linter = getLinter(filePath);
    return linter.format(code, filePath);
}

exports.check = check;
exports.format = format;
