/**
 * @file: diagnostic.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 19:20:47
 * @last modified by: yanglei07
 * @last modified time: 2018-06-10 16:29:1
 */

/* global  */
'use strict';

const vscode = require('vscode');

const {languages, Diagnostic, Position, Range} = vscode;

const diagnosticCollection = languages.createDiagnosticCollection('fecs');

function createDiagnostic(data) {

    const lineIndex = data.line - 1;
    const cloumnIndex = data.column - 1;
    const startPos = new Position(lineIndex, cloumnIndex);
    const endPos = new Position(lineIndex, cloumnIndex);
    const range = new Range(startPos, endPos);

    const message = data.msg;
    const severity = data.severity === 2 ? 0 : 1;

    return new Diagnostic(range, message, severity);
}
exports.createDiagnostic = createDiagnostic;

/**
 * 显示诊断结果
 *
 * @param {Editor} editor Editor 实例
 */
function showDiagnostics(editor) {

    const uri = editor.doc.vscDocument.uri;
    const diagnostics = editor.diagnostics;

    diagnosticCollection.clear();

    diagnosticCollection.set(uri, diagnostics);
}
exports.showDiagnostics = showDiagnostics;

exports.clearDiagnostics = () => diagnosticCollection.clear();
