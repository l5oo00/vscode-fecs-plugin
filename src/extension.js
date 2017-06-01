const Readable = require('stream').Readable;

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const window = vscode.window;
const workspace = vscode.workspace;

const fecs = require('fecs');
const File = require('vinyl');

let config = {
    en: false,
    level: 0,
    typeMap: new Map()
};

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

// function getDocumentType(document) {
//     let fileName = document.fileName || '';
//     let ext = fileName.split('.').pop();
//     return config.typeMap.get(ext);
// }

// function isSupported(document) {
//     let fileName = document.fileName || '';
//     let ext = fileName.split('.').pop();
//     return config.typeMap.has(ext);
// }



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

function runFecs(editor) {
    if (!editor) {
        return;
    }
    let document = editor.document;
    let fileName = document.fileName || '';
    let ext = fileName.split('.').pop();

    if (!config.typeMap.has(ext)) {
        return;
    }

    let type = config.typeMap.get(ext);
    let code = editor.document.getText();
    let stream = createCodeStream(code, type);

    log('runFecs');

    fecs.check({
        stream: stream,
        reporter: 'baidu',
        type: 'js,css,html'
    }, function (success, json) {
        let errors = json[0].errors;
        log('checkDone! Error count: ', errors.length);
        renderErrors(errors, editor);
    });
}

let lastDecorationType = null;
function renderErrors(errors, editor) {
    if (lastDecorationType) {
        lastDecorationType.dispose();
    }
    let largeNumberDecorationType = vscode.window.createTextEditorDecorationType({
        cursor: 'crosshair',
        backgroundColor: 'rgba(255,0,0,0.3)'
    });
    lastDecorationType = largeNumberDecorationType;
    let list = [];
    errors.forEach(err => {
        let lineIndex = err.line - 1;
        let startPos = new vscode.Position(lineIndex, 0);
        let endPos = new vscode.Position(lineIndex, 1);
        let decoration = {
            range: new vscode.Range(startPos, endPos),
            hoverMessage: 'fecs error'
        };
        list.push(decoration);
    });

    editor.setDecorations(largeNumberDecorationType, list);

    log(JSON.stringify(errors, null, 4));
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // function
    var configuration = workspace.getConfiguration('vscode-fecs-plugin');
    config.en = configuration.get('en', false);
    config.level = configuration.get('level', 0);
    setTypeMap(configuration);


    workspace.onDidChangeTextDocument(function (document) {
        console.log('workspace.onDidChangeTextDocument');
        runFecs(window.activeTextEditor);
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
    window.onDidChangeTextEditorSelection(function (editor) {
        // console.log('window.onDidChangeTextEditorSelection')
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
