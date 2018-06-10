/**
 * @file: extension.js
 * @author: yanglei07
 * @description ..
 * @create data: 2017-06-02 21:17:13
 * @last modified by: yanglei07
 * @last modified time: 2018-03-20 19:50:45
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';

/* eslint-disable fecs-no-require */
const Readable = require('stream').Readable;
const nodePathLib = require('path');

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
// const window = vscode.window;
// const workspace = vscode.workspace;
// const languages = vscode.languages;
const {window, workspace, languages} = vscode;

let fecsLib;
try {
    fecsLib = require('fecs');
}
catch (ex) {
    fecsLib = null;
}
const fecs = fecsLib;
const File = require('vinyl');
/* eslint-enable fecs-no-require */

const maxUnvisibleEditorDataCount = 20;

let config = {
    en: false,
    isAutoFix: false,
    level: 0,
    errorColor: '#f00',
    warningColor: '#ddb700',
    typeMap: new Map(),
    excludePaths: [],
    excludeFileNameSuffixes: []
};

let editorFecsDataMap = new Map();
let diagnosticCollection = languages.createDiagnosticCollection('fecs');

let extContext = null;
let statusBarItem = null;

let warningPointImagePath = '';
let errorPointImagePath = '';

let checkOff = false;

function log(...args) {
    /* eslint-disable no-console */
    console.log.apply(console, args);
    /* eslint-enable no-console */
}

function setTypeMap(configuration) {
    ['js', 'css', 'html'].forEach(type => {
        configuration.get(type + 'LikeExt', []).forEach(ext => {
            config.typeMap.set(ext, type);
        });
    });
}

function isSupportDocument(document) {
    let fileName = document.fileName || '';
    let ext = fileName.split('.').pop();

    let support = config.typeMap.has(ext);
    if (!support) {
        return false;
    }

    support = config.excludePaths.every(path => fileName.indexOf(nodePathLib.sep + path + nodePathLib.sep) === -1);
    if (!support) {
        // log('uncheck by path: ', fileName);
        return false;
    }

    support = config.excludeFileNameSuffixes.every(suffix => !fileName.endsWith(suffix));
    // !support && log('uncheck by suffix: ', fileName);

    return support;
}
function isSupportEditor(editor) {
    if (!editor || !editor.document) {
        return false;
    }

    return isSupportDocument(editor.document);
}

function createCodeStream(code = '', filePath = '') {

    let type = filePath.split('.').pop();

    let buf = new Buffer(code);
    let file = new File({
        contents: buf,
        path: filePath || 'current-file.' + type,
        stat: {
            size: buf.length
        }
    });
    let stream = new Readable();
    stream._read = function () {
        this.emit('data', file);
        this.push(null);
    };
    return stream;
}

function generateEditorFecsData(editor) {
    if (!editor || editorFecsDataMap.has(editor.id)) {
        return;
    }

    let fileName = editor.document ? editor.document.fileName : '';

    editorFecsDataMap.set(editor.id, {
        fileName: fileName,
        oldDecorationTypeList: [],
        delayTimer: null,
        isRunning: false,
        needCheck: true,
        errorMap: null,
        diagnostics: [],
        warningDecorationList: [],
        errorDecorationList: []
    });
}

function getEditorFecsData(editor) {
    if (!editor) {
        return null;
    }
    return editorFecsDataMap.get(editor.id);
}

function checkEditorFecsData(document) {
    log('checkEditorFecsData: ', document.fileName);

    if (editorFecsDataMap.size - window.visibleTextEditors.length < maxUnvisibleEditorDataCount) {
        return;
    }

    let newMap = new Map();
    let oldMap = editorFecsDataMap;
    window.visibleTextEditors.forEach(e => {
        let data = getEditorFecsData(e);
        if (data) {
            newMap.set(e.id, data);
        }
    });
    editorFecsDataMap = newMap;
    oldMap.clear();
}

function runFecs(editor, needDelay) {
    if (checkOff) {
        return;
    }
    if (!editor || !editor.document) {
        return;
    }

    let document = editor.document;

    if (!isSupportDocument(document)) {
        return;
    }

    generateEditorFecsData(editor);
    let editorFecsData = getEditorFecsData(editor);

    if (editorFecsData.isRunning) {
        return;
    }

    if (needDelay) {
        clearTimeout(editorFecsData.delayTimer);
        let editorId = editor.id;
        editorFecsData.delayTimer = setTimeout(() => {
            editorFecsData.delayTimer = null;

            runFecs(window.visibleTextEditors.filter(e => e.id === editorId)[0]);
        }, 1000);
        return;
    }

    if (!editorFecsData.needCheck) {
        renderErrors(editor);
        return;
    }

    let code = document.getText();
    let stream = createCodeStream(code, document.fileName);

    log('runFecs');

    editorFecsData.isRunning = true;
    editorFecsData.needCheck = false;
    fecs.check({
        lookup: true,
        stream: stream,
        reporter: config.en ? '' : 'baidu',
        level: config.level
    }, function (success, json) {
        let errors = (json[0] || {}).errors || [];
        log('checkDone! Error count: ', errors.length);
        prepareErrors(errors, editor);
        renderErrors(editor);
        editorFecsData.isRunning = false;
    });
}

function runFecsFormat(editor) {
    if (!editor || !editor.document) {
        return;
    }

    let document = editor.document;

    if (!isSupportDocument(document)) {
        return;
    }

    let code = document.getText();
    let stream = createCodeStream(code, document.fileName);

    let bufData = [];
    fecs.format({
        lookup: true,
        stream: stream,
        reporter: config.en ? '' : 'baidu',
        level: config.level
    }).on('data', function (file) {
        bufData = bufData.concat(file.contents);
    }).on('end', function () {
        let startPos = new vscode.Position(0, 0);
        let endPos = new vscode.Position(document.lineCount, 0);
        let range = new vscode.Range(startPos, endPos);

        vscode.window.activeTextEditor.edit(editBuilder => {
            editBuilder.replace(range, bufData.toString('utf8'));
        });
    });
}

function generateDecorationType(type = 'warning') {
    let pointPath = warningPointImagePath;
    let rulerColor = config.warningColor;

    if (type === 'error') {
        pointPath = errorPointImagePath;
        rulerColor = config.errorColor;
    }

    return vscode.window.createTextEditorDecorationType({
        gutterIconPath: pointPath,
        gutterIconSize: 'contain',
        overviewRulerColor: rulerColor
    });
}

function generateDecoration(lineIndex) {
    let startPos = new vscode.Position(lineIndex, 0);
    let endPos = new vscode.Position(lineIndex, 0);
    let decoration = {
        range: new vscode.Range(startPos, endPos)
    };
    return decoration;
}

function generateDiagnostic(data) {

    let lineIndex = data.line - 1;
    let cloumnIndex = data.column - 1;
    let startPos = new vscode.Position(lineIndex, cloumnIndex);
    let endPos = new vscode.Position(lineIndex, cloumnIndex);
    let range = new vscode.Range(startPos, endPos);

    let message = data.msg;
    let severity = data.severity === 2 ? 0 : 1;

    return new vscode.Diagnostic(range, message, severity);
}

function decorateEditor(editor, list, type, oldDecorationTypeList) {
    if (list.length) {
        let dt = generateDecorationType(type);
        oldDecorationTypeList.push(dt);
        editor.setDecorations(dt, list);
    }
}

function prepareErrors(errors, editor) {

    let editorFecsData = getEditorFecsData(editor);
    let oldDecorationTypeList = editorFecsData.oldDecorationTypeList;

    if (oldDecorationTypeList.length) {
        oldDecorationTypeList.forEach(type => type.dispose());
        oldDecorationTypeList = editorFecsData.oldDecorationTypeList = [];
    }

    if (editorFecsData.errorMap) {
        editorFecsData.errorMap.clear();
    }
    let errorMap = editorFecsData.errorMap = new Map();
    let diagnostics = editorFecsData.diagnostics = [];

    let warningDecorationList = editorFecsData.warningDecorationList = [];
    let errorDecorationList = editorFecsData.errorDecorationList = [];

    errors.forEach(err => {
        let lineIndex = err.line - 1;
        err.msg = err.message.trim() + ' (rule: ' + err.rule + ')';
        diagnostics.push(generateDiagnostic(err));
        errorMap.set(lineIndex, (errorMap.get(lineIndex) || []).concat(err));
    });
    errorMap.forEach(errs => {
        errs.sort((a, b) => b.severity - a.severity);
        let err = errs[0];
        let lineIndex = err.line - 1;
        let decortation = generateDecoration(lineIndex);
        if (err.severity === 2) {
            errorDecorationList.push(decortation);
        }
        else {
            warningDecorationList.push(decortation);
        }
    });
}

function renderErrors(editor) {
    let editorFecsData = getEditorFecsData(editor);

    if (!editorFecsData) {
        return;
    }

    let {errorDecorationList, warningDecorationList, oldDecorationTypeList} = editorFecsData;
    decorateEditor(editor, errorDecorationList, 'error', oldDecorationTypeList);
    decorateEditor(editor, warningDecorationList, 'warning', oldDecorationTypeList);

    // log(JSON.stringify(errors, null, 4));
    showErrorMessageInStatusBar(editor);
    showDiagnostics(editor);
}

function showErrorMessageInStatusBar(editor) {

    if (!editor || editor !== window.activeTextEditor) {
        return;
    }

    let selection = editor.selection;
    let line = selection.start.line; // 只显示选区第一行的错误信息
    let editorFecsData = getEditorFecsData(editor) || {};
    let errorMap = editorFecsData.errorMap;
    let errList = [];

    if (errorMap && errorMap.has(line)) {
        errList = errorMap.get(line);
    }

    if (!statusBarItem) {
        statusBarItem = window.createStatusBarItem(1);
        statusBarItem.show();
    }

    let showErr = errList[0] || {msg: '', severity: 0};

    statusBarItem.text = showErr.msg;
    statusBarItem.color = showErr.severity === 2 ? config.errorColor : config.warningColor;
    statusBarItem.tooltip = 'fecs:\n\n' + errList.map(err => err.msg).join('\n\n');
}

function clearStatusBarMessage() {
    if (!statusBarItem) {
        return;
    }

    statusBarItem.text = '';
    statusBarItem.tooltip = '';
}

function showDiagnostics(editor) {
    let editorFecsData = getEditorFecsData(editor);

    if (!editorFecsData) {
        return;
    }

    let uri = editor.document.uri;
    let diagnostics = editorFecsData.diagnostics;

    if (window.activeTextEditor !== editor) {
        diagnosticCollection.delete(uri);
        return;
    }

    diagnosticCollection.set(uri, diagnostics);
}

function registerFormatCommand() {
    return vscode.commands.registerCommand('vscode-fecs-plugin.format', () => {
        if (!vscode.window.activeTextEditor) {
            return;
        }

        const fileName = vscode.window.activeTextEditor.document.fileName;
        let fileType;

        if (fileName) {
            let matchArry = fileName.match(/.*\.(.*)$/);
            if (matchArry !== null) {
                fileType = matchArry[1].toLowerCase();
            }
        }

        if (
            fileType === 'js'
            || fileType === 'es'
            || fileType === 'html'
            || fileType === 'css'
            || fileType === 'less'
            || fileType === 'jsx'
            || fileType === 'vue'
        ) {
            runFecsFormat(vscode.window.activeTextEditor);
        }
    });
}

function registerToggleCommand() {
    return vscode.commands.registerCommand('vscode-fecs-plugin.toggle', () => {
        checkOff = !checkOff;

        let state = 'ON';
        if (checkOff) {
            clearDecoration();
            diagnosticCollection.clear();
            clearStatusBarMessage();
            editorFecsDataMap.clear();
            state = 'OFF';
        }
        else {
            startCheck();
        }
        window.showInformationMessage('Fecs Check: ' + state);
    });
}
function startCheck() {
    window.visibleTextEditors.forEach(function (editor, i) {
        runFecs(editor);
    });
}
function clearDecoration() {
    for (let item of editorFecsDataMap.values()) {

        let old = item.oldDecorationTypeList;
        if (old.length) {
            old.forEach(type => type.dispose());
            item.oldDecorationTypeList = [];
        }
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
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
    config.isAutoFix = configuration.get('autoSaveFix', false);
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

    // 保存文档前发出（saving...)
    workspace.onWillSaveTextDocument(function (event) {
        if (config.isAutoFix) {
            runFecsFormat(vscode.window.activeTextEditor);
        }
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
