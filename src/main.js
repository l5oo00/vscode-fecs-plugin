/**
 * @file: main.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 20:20:4
 * @last modified by: yanglei07
 * @last modified time: 2018-06-04 09:57:30
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';
const vscode = require('vscode');

const fecs = require('./fecs.js');
const {log, isSupportDocument, isSupportEditor} = require('./util.js');
const editorLib = require('./editor.js');
const ctxLib = require('./context.js');
const config = require('./config.js');

const {window, workspace, commands} = vscode;

let disableCheck = config.disableCheck;

function registerFormatCommand() {
    return commands.registerCommand('vscode-fecs-plugin.format', () => {
        let editor = window.activeTextEditor;
        if (!editor || !isSupportEditor(editor)) {
            return;
        }

        if (!isSupportEditor(editor)) {
            return;
        }

        editorLib.wrap(editor).format();
    });
}

function registerDisableCheckCommand() {
    return commands.registerCommand('vscode-fecs-plugin.disable-check', () => {
        disableCheck = true;
        editorLib.dispose();
        window.showInformationMessage('Fecs Check: OFF');
    });
}
function registerEnableCheckCommand() {
    return commands.registerCommand('vscode-fecs-plugin.enable-check', () => {
        disableCheck = false;
        checkAllVisibleTextEditor();
        window.showInformationMessage('Fecs Check: ON');
    });
}

/**
 * 检查所有窗口及内容可见的文件， 一般数量和编辑器拆分数量一致
 */
function checkAllVisibleTextEditor() {
    window.visibleTextEditors.forEach(e => {
        if (!isSupportEditor(e)) {
            return;
        }

        editorLib.wrap(e).check();
    });
}

function activate(context) {

    log(' is active!');

    ctxLib.set(context);

    // 该文档的所有 tab 都被关闭后触发
    workspace.onDidCloseTextDocument(document => {
        log('workspace.onDidCloseTextDocument', document.fileName);

        if (disableCheck) {
            return;
        }

        if (!isSupportDocument(document)) {
            return;
        }

        editorLib.disposeClosed();

        // 关闭全部窗口后， 可能不会触发  window.onDidChangeActiveTextEditor
        // 在这里做下兼容
        if (!window.activeTextEditor) {
            editorLib.switch();
        }
    });

    // 编辑文档后触发(coding...)
    workspace.onDidChangeTextDocument(event => {
        log('workspace.onDidChangeTextDocument', event.document.fileName);

        if (disableCheck) {
            return;
        }

        let document = event.document;

        if (!isSupportDocument(document)) {
            return;
        }

        window.visibleTextEditors.filter(e =>
            e.document && e.document.fileName === document.fileName
        ).forEach(e => {
            let editor = editorLib.wrap(e);
            editor.needCheck = true;
            editor.check(true);
        });
    });

    // 切换文件 Tab (或关闭某一 Tab)后触发
    window.onDidChangeActiveTextEditor(editor => {
        log('window.onDidChangeActiveTextEditor: ', editor.document.fileName);

        if (disableCheck) {
            return;
        }

        // editor 为 undefined 或不支持的文档时， 清除错误信息的渲染
        editorLib.switch(editor);

        if (!editor) {
            return;
        }

        checkAllVisibleTextEditor();
    });

    // 光标移动后触发
    window.onDidChangeTextEditorSelection(event => {
        log('window.onDidChangeTextEditorSelection', event.textEditor.document.fileName);

        if (disableCheck) {
            return;
        }

        let editor = event.textEditor;
        if (!isSupportEditor(editor)) {
            return;
        }

        editorLib.wrap(editor).renderErrors();
    });


    context.subscriptions.push(registerFormatCommand());
    context.subscriptions.push(registerDisableCheckCommand());
    context.subscriptions.push(registerEnableCheckCommand());

    // 启动时检查一遍
    checkAllVisibleTextEditor();
}
exports.activate = activate;

// this method is called when your extension is deactivated
exports.deactivate = () => {};
