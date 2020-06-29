/**
 * @file: diagnostic.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 19:20:47
 * @last modified by: yanglei07
 * @last modified time: 2018-07-12 09:41:15
 */
const {languages, Diagnostic, Position, Range, CodeActionKind, CodeAction} = require('vscode');
const {isSupportLinter} = require('./comment.js');

const diagnosticCollection = languages.createDiagnosticCollection('fecs');

class AddDisableComment {
    provideCodeActions(document, range, context, token) {
        return context.diagnostics
            .filter(diagnostic => {
                let has = false;
                diagnosticCollection.forEach((uri, diagnostics) => {
                    has = has || diagnostics.includes(diagnostic);
                });
                return has;
            })
            .map(diagnostic => this.createCodeAction(diagnostic));
    }

    createCodeAction(diagnostic) {
        const action = new CodeAction(`忽略这行报错： ${diagnostic.message}`, CodeActionKind.QuickFix);

        action.command = {
            command: 'vscode-fecs-plugin.add-disable-rule-comment-for-line',
            title: 'Add disable rule comment to ignore this error.',
            arguments: [diagnostic.range.start.line]
        };
        action.diagnostics = [diagnostic];

        return action;
    }
}
AddDisableComment.providedCodeActionKinds = [
    CodeActionKind.QuickFix
];

const registeredCodeActionProvider = new Map();
function registerCodeActionProvider(editor) {
    let languageId = editor.doc.vscDocument.languageId;
    if (!languageId || registeredCodeActionProvider.has(languageId)) {
        return;
    }

    languages.registerCodeActionsProvider(languageId, new AddDisableComment(), {
        providedCodeActionKinds: AddDisableComment.providedCodeActionKinds
    });

    registeredCodeActionProvider.set(languageId, true);
}



function createDiagnostic(data, editor) {

    const startLineIndex = data.line - 1;
    const startCloumnIndex = data.column - 1;
    const endLineIndex = data.endLine - 1;
    const endColumnIndex = data.endColumn - 1;
    const startPos = new Position(startLineIndex, startCloumnIndex);
    const endPos = new Position(endLineIndex, endColumnIndex);
    const range = new Range(startPos, endPos);

    const message = data.msg;
    const severity = data.severity === 2 ? 0 : 1;

    if (isSupportLinter(data.linterType)) {
        registerCodeActionProvider(editor);
    }

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

