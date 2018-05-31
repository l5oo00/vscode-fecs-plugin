/**
 * @file: main.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 20:20:4
 * @last modified by: yanglei07
 * @last modified time: 2018-05-31 20:21:13
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';

const vscode = require('vscode');

const {window, workspace, languages} = vscode;


function activate(context) {

    if (!fecs) {
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

    extContext = context;
    warningPointImagePath = extContext.asAbsolutePath('images/warning.svg');
    errorPointImagePath = extContext.asAbsolutePath('images/error.svg');

    let configuration = workspace.getConfiguration('vscode-fecs-plugin');
    config.en = configuration.get('en', false);
    config.level = configuration.get('level', 0);
    setTypeMap(configuration);
    config.excludePaths = configuration.get('excludePaths', []);
    config.excludeFileNameSuffixes = configuration.get('excludeFileNameSuffixes', []);

    workspace.onDidCloseTextDocument(function (document) {
        log('workspace.onDidCloseTextDocument');
        if (!isSupportDocument(document)) {
            return;
        }
        checkEditorFecsData(document);

        if (document && document.uri) {
            diagnosticCollection.delete(document.uri);
        }

        if (!window.activeTextEditor) {
            clearStatusBarMessage();
        }
    });

    // 编辑文档后触发(coding...)
    workspace.onDidChangeTextDocument(function (event) {
        if (checkOff) {
            return;
        }
        log('workspace.onDidChangeTextDocument');
        let editor = window.activeTextEditor;
        let document = event.document;

        if (!isSupportDocument(document)) {
            return;
        }

        window.visibleTextEditors.filter(e =>
            e.document && e.document.fileName === document.fileName
        ).forEach(e => {
            (getEditorFecsData(e) || {}).needCheck = true;
            runFecs(e, true);
        });
        showErrorMessageInStatusBar(editor);
    });

    // 切换文件 tab 后触发
    window.onDidChangeActiveTextEditor(function (editor) {
        if (checkOff) {
            return;
        }
        if (!editor) {
            return;
        }
        log('window.onDidChangeActiveTextEditor: ', editor.id);

        diagnosticCollection.clear();
        showErrorMessageInStatusBar(editor);
        showDiagnostics(editor);

        window.visibleTextEditors.forEach(function (e, i) {
            if (!isSupportEditor(e)) {
                return;
            }
            runFecs(e, true);
        });

        // if (!isSupportEditor(editor)) {
        //     return;
        // }

        // runFecs(editor, true);
    });

    // 光标移动后触发
    window.onDidChangeTextEditorSelection(function (event) {
        if (checkOff) {
            return;
        }
        log('window.onDidChangeTextEditorSelection');

        if (!event.textEditor || !event.textEditor.document || !isSupportDocument(event.textEditor.document)) {
            return;
        }

        if (event.textEditor === window.activeTextEditor) {
            showErrorMessageInStatusBar(event.textEditor);
        }
    });

    startCheck();

    context.subscriptions.push(registerFormatCommand());
    context.subscriptions.push(registerToggleCommand());
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
