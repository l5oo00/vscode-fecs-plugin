/**
 * @file: statusbar.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 19:35:24
 * @last modified by: yanglei07
 * @last modified time: 2018-05-31 19:56:48
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';

const vscode = require('vscode');

const config = require('./config.js');

const {window, Position} = vscode;

let statusBarItem = null;

function showErrorMessage(editor) {

    let vscEditor = editor.vscEditor;

    let selection = vscEditor.selection;
    let line = selection.start.line; // 只显示选区第一行的错误信息

    let errorMap = editor.errorMap;
    let errList = [];

    if (errorMap && errorMap.has(line)) {
        errList = errorMap.get(line);
    }

    if (!statusBarItem) {
        statusBarItem = window.createStatusBarItem(1);
        statusBarItem.show();
    }

    let showErr = errList[0] || {msg: '', severity: 0};

    statusBarItem.text = showErr.msg;
    statusBarItem.color = showErr.severity === 2 ? config.errorColor : config.warningColor;
    statusBarItem.tooltip = 'fecs:\n\n' + errList.map(err => err.msg).join('\n\n');
}
exports.showErrorMessage = showErrorMessage;


function clear() {
    if (!statusBarItem) {
        return;
    }

    statusBarItem.text = '';
    statusBarItem.tooltip = '';
}
exports.clear = clear;
