/**
 * @file: util.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 18:24:6
 * @last modified by: yanglei07
 * @last modified time: 2018-06-03 14:49:28
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

const languageMap = {
    javascript: 'js',
    javascriptreact: 'jsx',
    css: 'css',
    less: 'less',
    scss: 'scss',
    html: 'html',
    vue: 'vue',
    san: 'san'
};
function getFileExtName(document) {
    let fileName = document.fileName || '';
    let ext = nodePathLib.extname(fileName).substr(1);

    // 没有扩展名的文件， 根据语言来识别
    if (!ext) {
        ext = languageMap[document.languageId] || '';
    }
    return ext;
}
exports.getFileExtName = getFileExtName;

function isSupportDocument(document) {
    let fileName = document.fileName || '';
    let ext = getFileExtName(document);


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

function isSupportEditor(editor) {
    return isSupportDocument(editor.document);
}
exports.isSupportEditor = isSupportEditor;
