/**
 * @file: util.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 18:24:6
 * @last modified by: yanglei07
 * @last modified time: 2018-05-31 18:27:36
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';
const nodePathLib = require('path');

const config = require('./config.js');


function log(...args) {
    args.unshift('vscode-fecs-plugin: ');
    /* eslint-disable no-console */
    console.log(...args);
    /* eslint-enable no-console */
}
exports.log = log;

function isSupportDocument(document) {
    let fileName = document.fileName || '';
    let ext = fileName.split('.').pop();

    let support = config.typeMap.has(ext);
    if (!support) {
        return false;
    }

    support = config.excludePaths.every(path => fileName.indexOf(nodePathLib.sep + path + nodePathLib.sep) === -1);
    if (!support) {
        // log('uncheck by path: ', fileName);
        return false;
    }

    support = config.excludeFileNameSuffixes.every(suffix => !fileName.endsWith(suffix));
    // !support && log('uncheck by suffix: ', fileName);

    return support;
}
exports.isSupportDocument = isSupportDocument;
