/**
 * @file: editor.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 17:46:14
 * @last modified by: yanglei07
 * @last modified time: 2018-06-03 14:23:22
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';
const vscode = require('vscode');
const documentLib = require('./document.js');
const {createDiagnostic, showDiagnostics, clearDiagnostics} = require('./diagnostic.js');
const {createDecoration, showDecoration} = require('./decoration.js');
const statusBar = require('./statusbar.js');
const log = require('./util.js').log;

const {window, Position, Range} = vscode;

let editorMap = new Map();

class Editor {
    constructor(vscEditor) {
        this.vscEditor = vscEditor;
        this.id = vscEditor.id;
        this.fileName = vscEditor.document ? vscEditor.document.fileName : '';

        this.checkDelayTimer = null;
        this.needCheck = true;
        this.isCheckRunning = false;
        this.isFormatRunning = false;

        this.clear();

        this.doc = documentLib.wrap(vscEditor.document);
    }

    clear() {

        if (this.errorMap) {
            this.errorMap.clear();
        }
        this.errorMap = new Map();

        if (this.decorationTypeList) {
            this.decorationTypeList.forEach(type => type.dispose());
        }
        this.decorationTypeList = [];

        this.diagnostics = [];
        this.warningDecorationList = [];
        this.errorDecorationList = [];
    }

    check(needDelay) {
        if (this.isCheckRunning) {
            return;
        }

        if (!this.needCheck) {
            this.renderErrors();
            return;
        }

        if (this.checkDelayTimer) {
            clearTimeout(this.checkDelayTimer);
            this.checkDelayTimer = null;
        }

        if (needDelay === true) {
            this.checkDelayTimer = setTimeout(() => {
                this.check();
            }, 1000);
            return;
        }

        this.isCheckRunning = true;
        this.needCheck = false;
        this.doc.check().then(errors => {
            log('checkDone! Error count: ', errors.length);
            this.prepareErrors(errors);
            this.renderErrors();
            this.isCheckRunning = false;
        }).catch(err => {
            log(err);
            this.isCheckRunning = false;
            this.needCheck = true;
        });
    }
    format() {
        if (this.isFormatRunning) {
            return;
        }

        this.isFormatRunning = true;

        this.doc.format().then(code => {
            let startPos = new Position(0, 0);
            let endPos = new Position(this.doc.vscDocument.lineCount, 0);
            let range = new Range(startPos, endPos);

            window.activeTextEditor.edit(editBuilder => {
                editBuilder.replace(range, code);
                this.isFormatRunning = false;
                window.showInformationMessage('Format Success!');
            });
        }).catch(err => {
            this.isFormatRunning = false;
        });
    }
    prepareErrors(errors) {

        this.clear();

        errors.forEach(err => {
            let lineIndex = err.line - 1;
            err.msg = err.message.trim() + ' (rule: ' + err.rule + ')';
            this.diagnostics.push(createDiagnostic(err));
            this.errorMap.set(lineIndex, (this.errorMap.get(lineIndex) || []).concat(err));
        });

        this.errorMap.forEach(errs => {
            errs.sort((a, b) => b.severity - a.severity);
            let err = errs[0];
            let lineIndex = err.line - 1;
            let decortation = createDecoration(lineIndex);
            if (err.severity === 2) {
                this.errorDecorationList.push(decortation);
            }
            else {
                this.warningDecorationList.push(decortation);
            }
        });

    }

    renderErrors() {

        showDecoration(this);

        // 需要判断当前 editor 是否 active
        if (this.vscEditor === window.activeTextEditor) {
            showDiagnostics(this);
            statusBar.showErrorMessage(this);
        }
    }

    dispose() {
        this.clear();
        // this.doc.dispose();
        this.doc = null;
        this.vscEditor = null;
    }
}

exports.wrap = vscEditor => {

    let editor = editorMap.get(vscEditor.id);

    if (!editor) {
        editor = new Editor(vscEditor);
        editorMap.set(vscEditor.id, editor);
    }
    return editor;
};

function clearErrorRenderOutOfEditor() {
    clearDiagnostics();
    statusBar.clear();
}

/**
 * toggle off 时调用
 */
exports.dispose = () => {

    clearErrorRenderOutOfEditor();

    for (let editor of editorMap.values()) {
        editor.dispose();
    }
    editorMap.clear();

    // 查漏补缺， 有点多余
    documentLib.dispose();
};

/**
 * 关闭某个文档时遍历检查
 */
exports.disposeClosed = () => {

    let unusedList = [];
    for (let editor of editorMap.values()) {
        if (editor.doc.vscDocument.isClosed) {
            unusedList.push(editor);
        }
    }

    unusedList.forEach(editor => {
        editorMap.delete(editor.id);
        editor.dispose();
    });

    // 查漏补缺， 有点多余
    documentLib.dispose();
};

/**
 * 切换编辑器 tab 时调用
 *
 * @param {TextEditor} vscEditor TextEditor
 */
exports.switch = vscEditor => {

    clearErrorRenderOutOfEditor();

    let editor = vscEditor ? editorMap.get(vscEditor.id) : null;
    if (editor) {
        editor.renderErrors();
    }
};
