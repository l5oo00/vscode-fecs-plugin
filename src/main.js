/**
 * @file: main.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 20:20:4
 * @last modified by: yanglei07
 * @last modified time: 2018-07-15 15:05:12
 */

/* global  */
'use strict';

const {log} = require('./util.js');
const editorLib = require('./editor.js');
const ctxLib = require('./context.js');
const {registerNewCommand} = require('./commands.js');
const {bindEvents} = require('./events.js');

function activate(context) {
    log(' is active!');

    ctxLib.set(context);

    bindEvents(context);
    registerNewCommand(context);

    // 启动时检查一遍
    editorLib.checkAllVisibleTextEditor();
}
exports.activate = activate;

// this method is called when your extension is deactivated
/* eslint-disable no-empty-function */
exports.deactivate = () => {};
/* eslint-enable no-empty-function */
