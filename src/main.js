/**
 * @file: main.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 20:20:4
 * @last modified by: yanglei07
 * @last modified time: 2018-06-02 19:03:50
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';
const vscode = require('vscode');

const fecs = require('./fecs.js');
const {log, isSupportDocument, isSupportEditor} = require('./util.js');
const editorLib = require('./editor.js');

const {window, workspace} = vscode;

let checkOff = false;

function checkAllVisibleTextEditor() {
    window.visibleTextEditors.forEach(e => {
        if (!isSupportEditor(e)) {
            return;
        }

        editorLib.wrap(e).check();
    });
}

function activate(context) {

    // @todo
    if (!fecs.imported) {
        window.showInformationMessage([
            'vscode-fecs-plugin: view the github repository(',
            ' https://github.com/l5oo00/vscode-fecs-plugin ',
            ') for details.'
        ].join(''));
        window.showErrorMessage([
            'vscode-fecs-plugin: Error: Can\'t find module: fecs. ',
            'Maybe you should install the fecs module in global ',
            'and set the correct NODE_PATH environment variable.'
        ].join(''));
        return;
    }
    log(' is active!');

    workspace.onDidCloseTextDocument(document => {
        log('workspace.onDidCloseTextDocument', document.fileName);

        if (checkOff) {
            return;
        }

        if (!isSupportDocument(document)) {
            return;
        }

        editorLib.dispose();
    });

    // 编辑文档后触发(coding...)
    workspace.onDidChangeTextDocument(event => {
        log('workspace.onDidChangeTextDocument', event.document.fileName);

        if (checkOff) {
            return;
        }

        let document = event.document;

        if (!isSupportDocument(document)) {
            return;
        }

        window.visibleTextEditors.filter(e =>
            e.document && e.document.fileName === document.fileName
        ).forEach(e => {
            editorLib.wrap(e).check();
        });
    });

    // 切换文件 tab 后触发
    window.onDidChangeActiveTextEditor(editor => {
        log('window.onDidChangeActiveTextEditor: ', editor.document.fileName);

        if (checkOff) {
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

        if (checkOff) {
            return;
        }

        let editor = event.textEditor;
        if (!isSupportEditor(editor)) {
            return;
        }

        editorLib.wrap(editor).renderErrors();
    });

    checkAllVisibleTextEditor();
}
exports.activate = activate;

// this method is called when your extension is deactivated
exports.deactivate = () => {};
