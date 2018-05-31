/**
 * @file: editor.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 17:46:14
 * @last modified by: yanglei07
 * @last modified time: 2018-05-31 19:59:26
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';
const util = require('./util.js');
const {createDiagnostic, showDiagnostics} = require('./diagnostic.js');
const {createDecoration, showDecoration} = require('./decoration.js');
const statusBar = require('./statusbar.js');

let editorMap = new Map();

class Editor {
    constructor(vscEditor) {
        this.vscEditor = vscEditor;
        this.id = vscEditor.id;
        this.fileName = vscEditor.document ? vscEditor.document.fileName : '';

        this.delayTimer = null;
        this.isRunning = false;
        this.needCheck = true;

        this.clear();

        this.doc = vscEditor.document;
        this.code = this.doc ? this.doc.getText() : '';

        editorMap.set(vscEditor.id, this);
    }

    isSupport() {

        if (!this.doc) {
            return false;
        }

        return util.isSupportDocument(this.doc);
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
        statusBar.showErrorMessage(this);
        showDiagnostics(this);
    }
}

exports.wrap = vscEditor => {
    if (!vscEditor) {
        return null;
    }

    let editor = editorMap.get(vscEditor.id);

    if (!editor) {
        editor = new Editor(vscEditor);
    }
    return editor;
};
