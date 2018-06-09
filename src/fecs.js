/**
 * @file: fecs.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 15:49:22
 * @last modified by: yanglei07
 * @last modified time: 2018-06-09 17:40:30
 */

/* global  */
'use strict';
const Readable = require('stream').Readable;
const nodePathLib = require('path');

const File = require('vinyl');

const config = require('./config.js');

const fecs = (() => {
    let fecsLib = null;
    try {
        fecsLib = require('fecs');
    }
    catch (ex) {
        fecsLib = null;
    }
    return fecsLib;
})();

function getLinterType(filePath) {
    let ext = nodePathLib.extname(filePath).substr(1);
    if (!ext) {
        return '';
    }

    if (ext === 'less') {
        return 'lesslint';
    }

    let type = config.typeMap.get(ext);
    if (!type) {
        return;
    }

    let linterType = 'eslint';

    switch (type) {
        case 'css':
            linterType = 'csshint';
            break;

        case 'html':
            linterType = 'htmlcs';
            break;

        default:
            linterType = 'eslint';
            break;
    }
    return linterType;
}

function createCodeStream(code = '', filePath = '') {

    let type = filePath.split('.').pop();

    let buf = Buffer.from(code);
    let file = new File({
        contents: buf,
        path: filePath || 'current-file.' + type,
        stat: {
            size: buf.length
        }
    });
    let stream = new Readable();
    stream._read = function () {
        this.emit('data', file);
        this.push(null);
    };
    return stream;
}

function check(oriCode = '', filePath = '') {

    let {code, disableErrors} = ignoreGlobalEslintDisalbe(oriCode, filePath);

    let fileStream = createCodeStream(code, filePath);
    let isES6 = isUseES6(code, filePath);
    let linterType = getLinterType(filePath);

    let p = new Promise((r, j) => {
        fecs.check({
            es: isES6 ? 6 : 5,
            lookup: true,
            stream: fileStream,
            reporter: config.en ? '' : 'baidu',
            level: config.level
        }, (success, json) => {

            let errors = (json[0] || {}).errors || [];
            errors = errors.concat(disableErrors);
            errors.forEach(err => err.linterType = linterType);
            r(errors);
        });
    });

    return p;
}

function format(oriCode = '', filePath = '') {

    let code = ignoreGlobalEslintDisalbe(oriCode, filePath).code;

    let fileStream = createCodeStream(code, filePath);
    let isES6 = isUseES6(code, filePath);

    let p = new Promise((r, j) => {

        let bufData = [];
        fecs.format({
            es: isES6 ? 6 : 5, // 好像  此项配置对 format 无效？
            lookup: true,
            stream: fileStream,
            reporter: config.en ? '' : 'baidu',
            level: config.level
        }).on('data', file => {
            bufData = bufData.concat(file.contents);
        }).on('end', () => {
            r(bufData.toString('utf8'));
        });
    });

    return p;
}

/**
 * 通过正则简单判断是否是 es6 语法， 只能覆盖一部分场景， 无法 100% 识别， 但一般基本够用
 *
 * @note 魔改 fecs 后， 此功能基本成废物了 ： https://github.com/ecomfe/fecs/pull/323
 *
 * @param {string} code 代码字符串
 * @param {string} filePath 代码文件路径
 * @return {boolean} 是 es 语法则返回 true
 */
function isUseES6(code, filePath) {

    // 非 .js 文件不会使用此项配置， 直接返回 false
    if (!/\.js$/.test(filePath)) {
        return false;
    }

    // 清除字符串和注释
    // 正则参考的这里： https://github.com/fex-team/fis3/blob/master/lib/compile.js#L322
    code = code

        // 清除字符串
        .replace(/'(?:[^\\'\n\r\f]|\\[\s\S])*'/g, '\'\'') // 清除单引号字符串
        .replace(/"(?:[^\\"\n\r\f]|\\[\s\S])*"/g, '\'\'') // 清除双引号字符串
        .replace(/`(?:[^\\`\n\r\f]|\\[\s\S])*`/g, '\'\'') // 清除反引号模板字符串

        // 清除注释
        .replace(/\/\/[^\r\n\f]+/g, '') // 清除单行注释
        .replace(/\/\*[\s\S]+?(?:\*\/|$)/g, '') // 清除多行注释

        // 清除正则表达式
        .replace(/\/(?:[^\\/\n\r\f]|\\[\s\S])+\/[gimuy]*/g, '/x/');

    //  匹配 ES6 语法， 估计一堆 bug, 凑合用
    let regList = [
        /(^|[^.])\b(let|const|import|export|of|class|async|yield|await)\b([^.]|$)/, // 部分关键字

        /[\]}]\s*=/, // 解构： var {x,y} = obj; var [x,y] = arr;
        /=>|\.\.\./, // 箭头函数、解构
        /(^|[^.])function[^(]*\(.+=.+\)/, // 函数参数默认值
        /(^|[^.])function[^(]*\(.*[{}[\]].*\)/, // 函数参数解构
        /(^|[^.])function\s*\*/ // generator 语法
    ];

    return regList.some(reg => reg.test(code));
}

function ignoreGlobalEslintDisalbe(code, filePath) {

    let disableErrors = [];

    // 非 .js 文件不做处理， 直接返回
    if (!config.ignoreGlobalEslintDisalbe || !/\.js$/.test(filePath)) {
        return {code, disableErrors};
    }

    // 将含有 全局 disable 注释的那一行也标记位错误
    let lastLineOffset = 0;
    let lastLineIndex = 1;
    code = code.replace(/(\/\*\s*)eslint-disable(\s\*\/)|\n/g, (m, prefix, suffix, offset) => {
        if (m === '\n') {
            lastLineIndex++;
            lastLineOffset = offset;
            return m;
        }
        let err = {
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

exports.check = check;
exports.format = format;

// 是否成功引入 fecs
exports.imported = !!fecs;
