/**
 * @file: fecs.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 15:49:22
 * @last modified by: yanglei07
 * @last modified time: 2018-06-04 12:03:6
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';
const Readable = require('stream').Readable;

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

function check(code = '', filePath = '') {

    let fileStream = createCodeStream(code, filePath);

    let p = new Promise((r, j) => {
        fecs.check({
            lookup: true,
            stream: fileStream,
            reporter: config.en ? '' : 'baidu',
            level: config.level
        }, (success, json) => {

            let errors = (json[0] || {}).errors || [];
            r(errors);
        });
    });

    return p;
}

function format(code = '', filePath = '') {

    let fileStream = createCodeStream(code, filePath);

    let p = new Promise((r, j) => {

        let bufData = [];
        fecs.format({
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

exports.check = check;
exports.format = format;

// 是否成功引入 fecs
exports.imported = !!fecs;
