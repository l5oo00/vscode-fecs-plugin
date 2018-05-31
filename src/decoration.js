/**
 * @file: decoration.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 19:13:25
 * @last modified by: yanglei07
 * @last modified time: 2018-05-31 19:46:15
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';

const vscode = require('vscode');

const config = require('./config.js');
const pluginContextFactory = require('./context.js');

const {window, Position} = vscode;

let warningPointImagePath = '';
let errorPointImagePath = '';

function initPath() {
    if (!warningPointImagePath) {
        let ctx = pluginContextFactory.get();
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
    let startPos = new Position(lineIndex, 0);
    let endPos = new Position(lineIndex, 0);
    let decoration = {
        range: new Range(startPos, endPos)
    };
    return decoration;
}
exports.createDecoration = createDecoration;


function decorateEditor(editor, list, type, oldDecorationTypeList) {
    if (list.length) {
        let dt = createDecorationType(type);
        oldDecorationTypeList.push(dt);
        editor.setDecorations(dt, list);
    }
}

function showDecoration(editor) {
    decorateEditor(editor.vscEditor, editor.errorDecorationList, 'error', editor.decorationTypeList);
    decorateEditor(editor.vscEditor, editor.warningDecorationList, 'warning', editor.decorationTypeList);
}
exports.showDecoration = showDecoration;
