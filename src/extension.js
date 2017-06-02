const Readable = require('stream').Readable;
const nodePathLib = require('path');

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const window = vscode.window;
const workspace = vscode.workspace;
const Uri = vscode.Uri;

const fecs = require('fecs');
const File = require('vinyl');

let config = {
    en: false,
    level: 0,
    typeMap: new Map()
};

let editorFecsDataMap = new Map();

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
    if (editorFecsDataMap.has(editor.document)) {
        return;
    }
    editorFecsDataMap.set(editor.document, {
        oldDecorationTypeList: [],
        delayTimer: null,
        isRunning: false,
        errorMap: null
    });
}
function getEditorFecsData (editor) {
    return editorFecsDataMap.get(editor.document);
}

function runFecs(editor, needDelay) {
    if (!editor) {
        return;
    }
    let document = editor.document;
    let fileName = document.fileName || '';
    let ext = fileName.split('.').pop();

    if (!config.typeMap.has(ext)) {
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

    let type = config.typeMap.get(ext);
    let code = editor.document.getText();
    let stream = createCodeStream(code, type);

    log('runFecs');

    editorFecsData.isRunning = true;
    fecs.check({
        stream: stream,
        reporter: 'baidu',
        type: 'js,css,html'
    }, function (success, json) {
        let errors = json[0].errors;
        log('checkDone! Error count: ', errors.length);
        renderErrors(errors, editor);
        editorFecsData.isRunning = false;
    });
}

function generateDecorationType (type = 'warning') {
    let pointPath = warningPointImagePath;
    let rulerColor = '#ddb700';

    if (type === 'error') {
        pointPath = errorPointImagePath;
        rulerColor = '#f00';
    }

    return vscode.window.createTextEditorDecorationType({
        gutterIconPath: pointPath,
        gutterIconSize: 'contain',
        overviewRulerColor: rulerColor
    });
}

function generateDecoration (lineIndex) {
    let startPos = new vscode.Position(lineIndex, 0);
    let endPos = new vscode.Position(lineIndex, 1);
    let decoration = {
        range: new vscode.Range(startPos, endPos)
    };
    return decoration;
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

    let warningDecorationList = [];
    let errorDecorationList = [];
    errors.forEach(err => {

        let lineIndex = err.line - 1;

        errorMap.set(lineIndex, (errorMap.get(lineIndex) || []).concat(err.message.trim()));
        let decotation = generateDecoration(lineIndex);
        if (err.severity === 2) {
            errorDecorationList.push(decotation);
        }
        else {
            warningDecorationList.push(decotation);
        }
    });

    decorateEditor(editor, warningDecorationList, 'warning', oldDecorationTypeList);
    decorateEditor(editor, errorDecorationList, 'error', oldDecorationTypeList);

    // log(JSON.stringify(errors, null, 4));
    showErrorMessageInStatusBar(editor);
}

function showErrorMessageInStatusBar (editor) {
    let selection = editor.selection;
    let line = selection.start.line; // 只显示选区第一行的错误信息
    let editorFecsData = getEditorFecsData(editor) || {};
    let errorMap = editorFecsData.errorMap;
    let msg = [];

    if (errorMap && errorMap.has(line)) {
        msg = errorMap.get(line);
        log('showErrorMessageInStatusBar: \n    ' + msg.join('\n    '));
    }

    if (!statusBarItem) {
        statusBarItem = window.createStatusBarItem(1);
        statusBarItem.show();
    }

    statusBarItem.text = msg[0];
    statusBarItem.tooltip = msg.join('\n');
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


    workspace.onDidChangeTextDocument(function (document) {
        console.log('workspace.onDidChangeTextDocument');
        runFecs(window.activeTextEditor, true);
        showErrorMessageInStatusBar(window.activeTextEditor);
    });
    // window.onDidChangeActiveTextEditor(function (editor) {
    //     console.log('window.onDidChangeActiveTextEditor')
    // });
    window.onDidChangeVisibleTextEditors(function (editor) {
        console.log('window.onDidChangeVisibleTextEditors, editor count: ', window.visibleTextEditors.length);
        window.visibleTextEditors.filter(function (e) {
            return e !== editor;
        }).forEach(function (e, i) {
            runFecs(e);
        });
        runFecs(editor);
    });
    window.onDidChangeTextEditorSelection(function (event) {
        console.log('window.onDidChangeTextEditorSelection');
        showErrorMessageInStatusBar(event.textEditor);
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
