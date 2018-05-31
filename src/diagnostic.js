/**
 * @file: diagnostic.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 19:20:47
 * @last modified by: yanglei07
 * @last modified time: 2018-05-31 19:51:51
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';

const vscode = require('vscode');

const {window, languages, Diagnostic, Position} = vscode;

let diagnosticCollection = languages.createDiagnosticCollection('fecs');

function createDiagnostic(data) {

    let lineIndex = data.line - 1;
    let cloumnIndex = data.column - 1;
    let startPos = new Position(lineIndex, cloumnIndex);
    let endPos = new Position(lineIndex, cloumnIndex);
    let range = new Range(startPos, endPos);

    let message = data.msg;
    let severity = data.severity === 2 ? 0 : 1;

    return new Diagnostic(range, message, severity);
}
exports.createDiagnostic = createDiagnostic;

/**
 * 显示诊断结果
 *
 * @param {Editor} editor Editor 实例
 */
function showDiagnostics(editor) {

    let uri = editor.doc.uri;
    let diagnostics = editor.diagnostics;

    if (window.activeTextEditor !== editor.vscEditor) {
        diagnosticCollection.delete(uri);
        return;
    }

    diagnosticCollection.set(uri, diagnostics);
}
exports.showDiagnostics = showDiagnostics;
