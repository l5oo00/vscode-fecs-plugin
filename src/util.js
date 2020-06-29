/**
 * @file: util.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 18:24:6
 * @last modified by: yanglei07
 * @last modified time: 2018-09-06 13:39:48
 */

/* global  */
'use strict';
const nodePathLib = require('path');
const nodeUrlLib = require('url');
const childProcess = require('child_process');

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
    typescript: 'ts',
    typescriptreact: 'tsx',
    css: 'css',
    less: 'less',
    scss: 'scss',
    html: 'html',
    vue: 'vue',
    san: 'san'
};

function getExtByTypeMap(fileName) {
    let arr = fileName.split('.');

    // 过滤  .xxx 这种的文件名
    if (!arr[0]) {
        arr = arr.slice(1);
    }

    arr.shift();

    while (arr.length > 0) {
        let ext = arr.join('.');
        if (config.typeMap.has(ext)) {
            return ext;
        }
        arr.shift();
    }
    return '';
}

function getFileExtName(document) {

    let fileName = '';
    let languageId = '';
    if (typeof document === 'string') {
        fileName = document;
    }
    else {
        fileName = document.fileName || '';
        languageId = document.languageId;
    }

    let ext = getExtByTypeMap(nodePathLib.basename(fileName)) || nodePathLib.extname(fileName).substr(1);

    // 没有扩展名的文件， 根据语言来识别
    if (!ext && languageId) {
        ext = languageMap[languageId] || '';
    }
    return ext;
}
exports.getFileExtName = getFileExtName;

function checkGitDomain(filePath, testArr) {
    const dir = nodePathLib.dirname(filePath);
    const cmd = 'git remote -v';

    try {
        let list = childProcess.execSync('cd ' + dir + ' && ' + cmd, {encoding: 'utf8'});
        list = list.split(/\r?\n/).map(line => line.trim()).filter(line => line);

        return list.some(line => {
            const url = line.split(/\s+/)[1];
            const urlObj = nodeUrlLib.parse(url);
            const domain = urlObj.hostname;

            return testArr.some(test => domain.endsWith(test));
        });
    }
    catch (ex) {
        return false;
    }
}

function isSupportFilePath(filePath, ext = '') {

    if (!ext) {
        ext = nodePathLib.extname(filePath).substr(1);
    }

    if (!ext) {
        return false;
    }

    let support = config.typeMap.has(ext);
    if (!support) {
        return false;
    }

    support = config.excludePaths.every(path => filePath.indexOf(nodePathLib.sep + path + nodePathLib.sep) === -1);
    if (!support) {
        // log('uncheck by path: ', filePath);
        return false;
    }

    support = config.excludeFileNameSuffixes.every(suffix => !filePath.endsWith(suffix));
    // !support && log('uncheck by suffix: ', filePath);

    if (config.supportByGitDomainTest.length) {
        support = checkGitDomain(filePath, config.supportByGitDomainTest);
    }

    return support;
}
exports.isSupportFilePath = isSupportFilePath;

function isSupportDocument(document) {
    const fileName = document.fileName || '';
    const ext = getFileExtName(document);

    return isSupportFilePath(fileName, ext);
}
exports.isSupportDocument = isSupportDocument;

function isSupportEditor(editor) {
    return isSupportDocument(editor.document);
}
exports.isSupportEditor = isSupportEditor;


function getSelectionPosition(selection) {

    let start = selection.anchor;
    let stop = selection.active;
    if (selection.isReversed) {
        start = selection.active;
        stop = selection.anchor;
    }
    return {start, stop};
}
exports.getSelectionPosition = getSelectionPosition;


function isVueLike(extName) {
    return config.typeMap.get(extName) === 'vue';
}
exports.isVueLike = isVueLike;

function isJsLike(extName) {
    return config.typeMap.get(extName) === 'js';
}
exports.isJsLike = isJsLike;

/**
 * 忽略全局 eslint-disable
 *
 * @param {string} code 源码字符串
 * @param {string} filePath 文件路径
 * @return {Object} 返回值
 */
function ignoreGlobalEslintDisalbe(code, filePath) {

    const disableErrors = [];
    const ext = getExtByTypeMap(filePath);

    // 非 .js 文件不做处理， 直接返回
    if (!config.ignoreGlobalEslintDisalbe || !ext || !isJsLike(ext)) {
        return {code, disableErrors};
    }

    // 将含有 全局 disable 注释的那一行也标记位错误
    let lastLineOffset = 0;
    let lastLineIndex = 1;
    code = code.replace(/(\/\*\s*)eslint-disable(\s*\*\/)|\n/g, (m, prefix, suffix, offset) => {
        if (m === '\n') {
            lastLineIndex++;
            lastLineOffset = offset;
            return m;
        }
        const err = {
            message: '大神， 求不要这么暴力的 eslint-disable , 可怜可怜后面的接盘侠吧~',
            rule: 'no-eslint-global-disable',
            line: lastLineIndex,
            column: offset - lastLineOffset,
            severity: 2
        };
        disableErrors.push(err);
        return prefix + 'eslint-enable' + suffix;
    });
    return {code, disableErrors};
}
exports.ignoreGlobalEslintDisalbe = ignoreGlobalEslintDisalbe;
