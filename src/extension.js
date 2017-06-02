const Readable = require('stream').Readable;
const nodePathLib = require('path');

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const window = vscode.window;
const workspace = vscode.workspace;
const languages = vscode.languages;
const Uri = vscode.Uri;

const fecs = require('fecs');
const File = require('vinyl');

let config = {
    en: false,
    level: 0,
    errorColor: '#f00',
    warningColor: '#ddb700',
    typeMap: new Map()
};

let editorFecsDataMap = new Map();
let diagnosticCollection = languages.createDiagnosticCollection('fecs');

let extContext = null;
let statusBarItem = null;

let warningPointImagePath = '';
let errorPointImagePath = '';

function log() {
    console.log.apply(console, arguments);
}

function setTypeMap(configuration) {
    ['js', 'css', 'html'].forEach(type => {
        configuration.get(type + 'LikeExt', []).forEach(ext => {
            config.typeMap.set(ext, type);
        });
    });
}

function isSupportDocument (document) {
    let fileName = document.fileName || '';
    let ext = fileName.split('.').pop();

    return config.typeMap.has(ext) ? {type: config.typeMap.get(ext)} : null;
}
function getFecsType (document) {
    let fileName = document.fileName || '';
    let ext = fileName.split('.').pop();

    return config.typeMap.get(ext);
}

function createCodeStream (code = '', type = '') {

    let buf = new Buffer(code);
    let file = new File({
        contents: buf,
        path: 'current-file.' + type,
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

function generateEditorFecsData (editor) {
    if (editorFecsDataMap.has(editor.id)) {
        return;
    }

    editorFecsDataMap.set(editor.id, {
        oldDecorationTypeList: [],
        delayTimer: null,
        isRunning: false,
        errorMap: null,
        diagnostics: []
    });
}
function getEditorFecsData (editor) {
    return editorFecsDataMap.get(editor.id);
}
function checkEditorFecsData (document) {
    log('checkEditorFecsData: ', document.fileName);
}

function runFecs(editor, needDelay) {
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
        editorFecsData.delayTimer = setTimeout(() => {
             editorFecsData.delayTimer = null;
            runFecs(editor);
        }, 1000);
        return;
    }

    let code = document.getText();
    let stream = createCodeStream(code, document.fileName.split('.').pop());

    log('runFecs');

    editorFecsData.isRunning = true;
    fecs.check({
        stream: stream,
        reporter: 'baidu',
        type: 'js,css,html'
    }, function (success, json) {
        let errors = (json[0] || {}).errors || [];
        log('checkDone! Error count: ', errors.length);
        renderErrors(errors, editor);
        editorFecsData.isRunning = false;
    });
}

function generateDecorationType (type = 'warning') {
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

function generateDecoration (lineIndex) {
    let startPos = new vscode.Position(lineIndex, 0);
    let endPos = new vscode.Position(lineIndex, 0);
    let decoration = {
        range: new vscode.Range(startPos, endPos)
    };
    return decoration;
}

function generateDiagnostic (data) {

    let lineIndex = data.line - 1;
    let cloumnIndex = data.column - 1;
    let startPos = new vscode.Position(lineIndex, cloumnIndex);
    let endPos = new vscode.Position(lineIndex, cloumnIndex);
    let range = new vscode.Range(startPos, endPos);

    let message = data.message;
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

function renderErrors(errors, editor) {

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

    let warningDecorationList = [];
    let errorDecorationList = [];
    errors.forEach(err => {
        let lineIndex = err.line - 1;
        diagnostics.push(generateDiagnostic(err));
        errorMap.set(lineIndex, (errorMap.get(lineIndex) || []).concat(err));
    });
    errorMap.forEach(errs => {
        errs.sort((a, b) => {
            return b.severity - a.severity;
        });
        let err = errs[0];
        let lineIndex = err.line - 1;
        let decotation = generateDecoration(lineIndex);
        if (err.severity === 2) {
            errorDecorationList.push(decotation);
        }
        else {
            warningDecorationList.push(decotation);
        }
    });

    decorateEditor(editor, errorDecorationList, 'error', oldDecorationTypeList);
    decorateEditor(editor, warningDecorationList, 'warning', oldDecorationTypeList);

    // log(JSON.stringify(errors, null, 4));
    showErrorMessageInStatusBar(editor);
    showDiagnostics(editor);
}

function showErrorMessageInStatusBar (editor) {

    if (editor !== window.activeTextEditor) {
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

    let showErr = errList[0] || {message: '', severity: 0};

    statusBarItem.text = showErr.message.trim();
    statusBarItem.color = showErr.severity === 2 ? config.errorColor : config.warningColor;
    statusBarItem.tooltip = errList.map(err => err.message.trim()).join('\n');
}

function showDiagnostics (editor) {
    let editorFecsData = getEditorFecsData(editor);
    let uri = editor.document.uri;
    let diagnostics = editorFecsData.diagnostics;

    if (window.activeTextEditor !== editor) {
        diagnosticCollection.delete(uri);
        return;
    }

    diagnosticCollection.set(uri, diagnostics);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    extContext = context;
    warningPointImagePath = context.asAbsolutePath('images/warning.svg');
    errorPointImagePath = context.asAbsolutePath('images/error.svg');

    var configuration = workspace.getConfiguration('vscode-fecs-plugin');
    config.en = configuration.get('en', false);
    config.level = configuration.get('level', 0);
    setTypeMap(configuration);

    workspace.onDidCloseTextDocument(function (document) {
        log('workspace.onDidCloseTextDocument');
        if (!isSupportDocument(document)) {
            return;
        }
        checkEditorFecsData(document);
    });

    // 编辑文档后触发(coding...)
    workspace.onDidChangeTextDocument(function (event) {
        log('workspace.onDidChangeTextDocument');
        let editor = window.activeTextEditor;
        let document = event.document;
        if (editor && editor.document && document.fileName === editor.document.fileName) {
            runFecs(window.activeTextEditor, true);
            showErrorMessageInStatusBar(window.activeTextEditor);
        }
    });

    // 切换文件 tab 后触发
    window.onDidChangeActiveTextEditor(function (editor) {

        diagnosticCollection.clear();

        log('window.onDidChangeActiveTextEditor: ', editor.id);
        window.visibleTextEditors.filter(function (e) {
            return e !== editor;
        }).forEach(function (e, i) {
            runFecs(e);
        });
        runFecs(editor);
        showErrorMessageInStatusBar(editor);
        showDiagnostics(editor);
    });

    // 光标移动后触发
    window.onDidChangeTextEditorSelection(function (event) {
        log('window.onDidChangeTextEditorSelection');
        if (event.textEditor === window.activeTextEditor) {
            showErrorMessageInStatusBar(event.textEditor);
        }
    });


    window.visibleTextEditors.forEach(function (editor, i) {
        runFecs(editor);
    });
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
