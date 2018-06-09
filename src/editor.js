/**
 * @file: editor.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 17:46:14
 * @last modified by: yanglei07
 * @last modified time: 2018-06-09 17:51:24
 */

/* global  */
'use strict';
const vscode = require('vscode');
const documentLib = require('./document.js');
const {createDiagnostic, showDiagnostics, clearDiagnostics} = require('./diagnostic.js');
const {createDecoration, showDecoration} = require('./decoration.js');
const addDisableComment = require('./comment.js').addDisableComment;
const statusBar = require('./statusbar.js');
const {log, getSelectionPosition} = require('./util.js');
const config = require('./config.js');

const {window, Position, Range} = vscode;

let editorMap = new Map();

class Editor {
    constructor(vscEditor) {
        this.vscEditor = vscEditor;
        this.id = vscEditor.id;
        this.fileName = vscEditor.document ? vscEditor.document.fileName : '';

        this.checkDelayTimer = null;
        this.checkDelayCancel = null;
        this.needCheck = true;
        this.checkPromise = null;
        this.formatPromise = null;

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
    clearCheckDelayTimer() {
        if (this.checkDelayTimer) {
            clearTimeout(this.checkDelayTimer);
            this.checkDelayTimer = null;
            this.checkDelayCancel();
            this.checkDelayCancel = null;
        }
    }

    /**
     * 对此 TextEditor 运行代码检查
     *
     * @param {boolean} needDelay 是否需要延迟执行， 一般只在编辑操作时会设置为 true
     * @return {Promise} checkPromise
     */
    check(needDelay = false) {
        if (this.checkPromise) {
            return this.checkPromise;
        }

        if (!this.needCheck) {
            // 文件语言没有改变则直接 render
            if (!this.doc.updateCheckFilePath()) {
                this.renderErrors();
                return Promise.resolve();
            }
        }

        this.clearCheckDelayTimer();

        if (needDelay === true) {
            let p = new Promise((r, j) => {
                this.checkDelayCancel = j;
                this.checkDelayTimer = setTimeout(() => {
                    this.checkDelayTimer = null;
                    r();
                    this.checkDelayCancel = null;
                }, 1000);
            });
            return p.then(() => {
                return this.check();
            }).catch(() => {});
        }

        this.needCheck = false;
        this.checkPromise = this.doc.check().then(errors => {
            log('checkDone! Error count: ', errors.length);
            this.prepareErrors(errors);
            this.renderErrors();
        }).catch(err => {
            log(err);
            this.needCheck = true;
        });
        this.checkPromise.then(() => {
            this.checkPromise = null;
        });
        return this.checkPromise;
    }

    /**
     * 对此 TextEditor 进行代码规范修复
     *
     * @return {Promise} formatPromise
     */
    format() {
        if (this.formatPromise) {
            return this.formatPromise;
        }

        this.formatPromise = this.doc.format().then(code => {
            let startPos = new Position(0, 0);
            let endPos = new Position(this.doc.vscDocument.lineCount, 0);
            let range = new Range(startPos, endPos);

            return this.vscEditor.edit(editBuilder => {
                editBuilder.replace(range, code);
                window.showInformationMessage('Format Success!');
            });
        });

        return this.formatPromise.catch(() => {}).then(() => {
            this.formatPromise = null;
        });
    }


    prepareErrors(errors) {

        this.clear();

        errors.forEach(err => {
            let lineIndex = err.line - 1;
            err.msg = err.message.trim();
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

    addDisableComment() {
        addDisableComment(this);
    }

    getViewRuleUrl() {
        let errors = this.getCurrentActiveErrors();
        let err = errors[0];

        if (!err) {
            return;
        }

        return config.searchUrl.replace(/\$\{query\}/, encodeURIComponent(err.linterType + ' ' + err.rule));
    }

    getCurrentActiveErrors() {
        let editor = this;
        let errorMap = editor.errorMap;
        if (errorMap.size === 0) {
            return;
        }

        let start = getSelectionPosition(editor.vscEditor.selection).start;
        let startLine = editor.doc.vscDocument.lineAt(start);
        let lineIndex = startLine.lineNumber;
        let errors = errorMap.get(lineIndex) || [];
        return errors;
    }

    dispose() {
        this.clear();
        this.clearCheckDelayTimer();
        this.doc = null;
        this.vscEditor = null;
    }
}

/**
 * 对 TextEditor 进行封装
 *
 * @param {TextEditor} vscEditor vscode 的  TextEditor 实例
 * @return {Editor} 封装的 Editor 实例
 */
exports.wrap = vscEditor => {

    let editor = editorMap.get(vscEditor.id);

    if (editor) {
        // vscEditor竟然会变， 这里需要更新下
        editor.vscEditor = vscEditor;
    }
    else {
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
