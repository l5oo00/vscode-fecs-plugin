/**
 * @file: statusbar.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 19:35:24
 * @last modified by: yanglei07
 * @last modified time: 2018-06-08 10:47:23
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';

const vscode = require('vscode');

const config = require('./config.js');

const window = vscode.window;

let msgItem = null;
let ruleItem = null;

function showErrorMessage({vscEditor, errorMap}) {


    let selection = vscEditor.selection;
    let line = selection.start.line; // 只显示选区第一行的错误信息

    let errList = [];

    if (errorMap && errorMap.has(line)) {
        errList = errorMap.get(line);
    }

    if (!msgItem) {
        msgItem = window.createStatusBarItem(1);
        ruleItem = window.createStatusBarItem(1);

        msgItem.command = ruleItem.command = 'vscode-fecs-plugin.search-rule-in-browser';
    }

    let showErr = errList[0] || {msg: '', rule: '', severity: 0};

    msgItem.text = showErr.msg;
    msgItem.color = showErr.severity === 2 ? config.errorColor : config.warningColor;
    msgItem.tooltip = 'fecs-msg:\n\n' + errList.map(err => err.msg).join('\n\n');
    msgItem.show();

    ruleItem.text = showErr.rule ? ' (rule: ' + showErr.rule + ')' : '';
    ruleItem.color = showErr.severity === 2 ? config.errorColor : config.warningColor;
    ruleItem.tooltip = 'fecs-rule:\n\n' + errList.map(err => err.rule).join('\n\n');
    ruleItem.show();
}
exports.showErrorMessage = showErrorMessage;


function clear() {
    if (!msgItem) {
        return;
    }

    msgItem.text = '';
    msgItem.tooltip = '';
    msgItem.hide();

    ruleItem.text = '';
    ruleItem.tooltip = '';
    ruleItem.hide();
}
exports.clear = clear;
