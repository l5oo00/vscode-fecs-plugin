/**
 * @file: events.js
 * @description ..
 */

const {window, workspace, TextDocumentSaveReason} = require('vscode');

const editorLib = require('./editor.js');
const config = require('./config.js');
const {log, isSupportDocument, isSupportEditor} = require('./util.js');


function bindEvents(context) {

    // 保存时自动 format
    config.autoFormatOnSave && workspace.onWillSaveTextDocument(event => {
        log('workspace.onWillSaveTextDocument', event.document.fileName);

        if (!isSupportDocument(event.document) || event.reason !== TextDocumentSaveReason.Manual
            || !window.activeTextEditor) {
            return;
        }

        const editor = editorLib.wrap(window.activeTextEditor);
        if (editor.errorMap.size === 0) {
            return;
        }

        event.waitUntil(editor.format());
    });

    // 该文档的所有 tab 都被关闭后触发
    workspace.onDidCloseTextDocument(document => {
        log('workspace.onDidCloseTextDocument', document.fileName);

        if (config.disableCheck) {
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

        if (config.disableCheck) {
            return;
        }

        const document = event.document;

        if (!isSupportDocument(document)) {
            return;
        }

        window.visibleTextEditors.filter(e => e.document && e.document.fileName === document.fileName).forEach(e => {
            const editor = editorLib.wrap(e);
            editor.needCheck = true;
            editor.check(true);
        });
    });

    // 切换文件 Tab (或关闭某一 Tab)后触发
    window.onDidChangeActiveTextEditor(editor => {
        log('window.onDidChangeActiveTextEditor: ', editor && editor.document && editor.document.fileName);

        if (config.disableCheck) {
            return;
        }

        // editor 为 undefined 或不支持的文档时， 清除错误信息的渲染
        editorLib.switch(editor);

        if (!editor) {
            return;
        }

        editorLib.checkAllVisibleTextEditor();
    });

    // 光标移动后触发
    window.onDidChangeTextEditorSelection(event => {
        log('window.onDidChangeTextEditorSelection', event.textEditor.document.fileName);

        if (config.disableCheck) {
            return;
        }

        const editor = event.textEditor;
        if (!isSupportEditor(editor)) {
            return;
        }

        editorLib.wrap(editor).renderErrors();
    });
}
exports.bindEvents = bindEvents;
