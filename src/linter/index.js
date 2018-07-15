/**
 * @file: index.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-07-11 17:29:4
 * @last modified by: yanglei07
 * @last modified time: 2018-07-15 15:22:27
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
    try {
        const linter = getLinter(filePath);
        return linter.check(code, filePath);
    }
    catch (ex) {
        return Promise.reject(ex);
    }
}

function format(code, filePath) {
    try {
        const linter = getLinter(filePath);
        return linter.format(code, filePath);
    }
    catch (ex) {
        return Promise.reject(ex);
    }
}

exports.check = check;
exports.format = format;
