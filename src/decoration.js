/**
 * @file: decoration.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 19:13:25
 * @last modified by: yanglei07
 * @last modified time: 2018-06-10 16:27:5
 */

/* global  */
'use strict';

const vscode = require('vscode');

const config = require('./config.js');
const pluginContextFactory = require('./context.js');

const {window, Position, Range} = vscode;

let warningPointImagePath = '';
let errorPointImagePath = '';

function initPath() {
    if (!warningPointImagePath) {
        const ctx = pluginContextFactory.get();
        warningPointImagePath = ctx.asAbsolutePath('images/warning.svg');
        errorPointImagePath = ctx.asAbsolutePath('images/error.svg');
    }
}
function createDecorationType(type = 'warning') {

    initPath();

    let pointPath = warningPointImagePath;
    let rulerColor = config.warningColor;

    if (type === 'error') {
        pointPath = errorPointImagePath;
        rulerColor = config.errorColor;
    }

    return window.createTextEditorDecorationType({
        gutterIconPath: pointPath,
        gutterIconSize: 'contain',
        overviewRulerColor: rulerColor
    });
}

function createDecoration(lineIndex) {
    const startPos = new Position(lineIndex, 0);
    const endPos = new Position(lineIndex, 0);
    const decoration = {
        range: new Range(startPos, endPos)
    };
    return decoration;
}
exports.createDecoration = createDecoration;


function decorateEditor(editor, list, type, decorationTypeList) {

    if (list.length) {
        const dt = createDecorationType(type);
        decorationTypeList.push(dt);
        editor.setDecorations(dt, list);
    }
}

function showDecoration(editor) {
    editor.decorationTypeList.forEach(type => type.dispose());
    editor.decorationTypeList = [];

    decorateEditor(editor.vscEditor, editor.errorDecorationList, 'error', editor.decorationTypeList);
    decorateEditor(editor.vscEditor, editor.warningDecorationList, 'warning', editor.decorationTypeList);
}
exports.showDecoration = showDecoration;
