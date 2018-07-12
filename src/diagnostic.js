/**
 * @file: diagnostic.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 19:20:47
 * @last modified by: yanglei07
 * @last modified time: 2018-07-12 09:41:15
 */

/* global  */
'use strict';

const vscode = require('vscode');

const {languages, Diagnostic, Position, Range} = vscode;

const diagnosticCollection = languages.createDiagnosticCollection('fecs');

function createDiagnostic(data) {

    const startLineIndex = data.line - 1;
    const startCloumnIndex = data.column - 1;
    const endLineIndex = data.endLine - 1;
    const endColumnIndex = data.endColumn - 1;
    const startPos = new Position(startLineIndex, startCloumnIndex);
    const endPos = new Position(endLineIndex, endColumnIndex);
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
