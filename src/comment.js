/**
 * @file: comment.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-06-06 13:42:14
 * @last modified by: yanglei07
 * @last modified time: 2018-07-12 10:18:19
 */

/* global  */

'use strict';
const {Position, window} = require('vscode');
const util = require('./util.js');

function initBlock(beginLine, endLine = null) {
    return {
        linterType: '',
        beginLineIndex: beginLine.lineNumber,
        EndLineIndex: endLine ? endLine.lineNumber : beginLine.lineNumber,
        beginLineWhitespacePrefix: beginLine.text.substr(0, beginLine.firstNonWhitespaceCharacterIndex)
            || '',
        endLineWhitespacePrefix: (
            endLine ? endLine.text.substr(0, endLine.firstNonWhitespaceCharacterIndex)
                : beginLine.text.substr(0, beginLine.firstNonWhitespaceCharacterIndex)
        ) || '',
        rules: new Set()
    };
}

// 支持自动添加注释的 linter
const supportLinterSet = new Set(['eslint', 'tslint']);
function isSupportLinter(linterType) {
    return supportLinterSet.has(linterType);
}
function formatComment(linterType, rules, enableOrDisable) {
    function eslint(rules, enableOrDisable) {
        return '/* eslint-' + enableOrDisable + ' ' + rules.join(',') + ' */';
    }
    function tslint(rules, enableOrDisable) {
        return '/* tslint:' + enableOrDisable + ':' + rules.join(' ') + ' */';
    }
    const map = {
        eslint, tslint
    };

    return map[linterType](rules, enableOrDisable);
}

function getErrorLineBlocks(editor) {
    const errorMap = editor.errorMap;
    const {start, stop} = util.getSelectionPosition(editor.vscEditor.selection);

    const startLine = editor.doc.vscDocument.lineAt(start);
    const stopLine = editor.doc.vscDocument.lineAt(stop);

    // 梳理代码块， 只包含有错误的代码块
    const blocks = [];
    let block = null;
    let errorLineCount = 0;
    let allRules = new Set();
    const vscDocument = editor.doc.vscDocument;
    for (let i = startLine.lineNumber; i <= stopLine.lineNumber; i++) {
        const errors = errorMap.get(i);
        if (!errors || errors.length === 0) {
            continue;
        }

        const rules = new Set();
        let linterType = '';
        const isSupport = errors.every(err => {
            rules.add(err.rule);
            linterType = err.linterType;
            return isSupportLinter(err.linterType);
        });
        if (!isSupport) {
            continue;
        }

        if (!block || block.EndLineIndex + 1 < i
            || linterType !== block.linterType // 应该不会存在这种情况吧？ 这里还是判断下
        ) {
            const beginLine = vscDocument.lineAt(i);
            block = initBlock(beginLine);
            blocks.push(block);
        }

        block.linterType = block.linterType || linterType;
        block.rules = new Set([...block.rules, ...rules]);
        block.EndLineIndex = i;
        allRules = new Set([...allRules, ...rules]);

        const endLine = vscDocument.lineAt(i);
        block.endLineWhitespacePrefix = endLine.text.substr(0, endLine.firstNonWhitespaceCharacterIndex);

        errorLineCount++;
    }

    return {blocks, errorLineCount, allRules};
}

function getErrorLineBlock(editor) {
    const errorMap = editor.errorMap;
    const {start, stop} = util.getSelectionPosition(editor.vscEditor.selection);

    const startLine = editor.doc.vscDocument.lineAt(start);
    const stopLine = editor.doc.vscDocument.lineAt(stop);

    const block = initBlock(startLine, stopLine);
    const blocks = [block];
    let errorLineCount = 0;
    for (let i = startLine.lineNumber; i <= stopLine.lineNumber; i++) {

        const errors = errorMap.get(i);
        if (!errors || errors.length === 0) {
            continue;
        }

        const rules = new Set();
        let linterType = '';
        const isSupport = errors.every(err => {
            rules.add(err.rule);
            linterType = err.linterType;
            return isSupportLinter(err.linterType);
        });

        block.linterType = block.linterType || linterType;

        // vue like 文件里， 可能会同时选择 js 和 （style 或 template）
        // 若选中的 template 和 style 里的代码没有问题， 这个检测就失效了
        // 自动加的注释就失效了， 这种情况我就不管了。。。
        if (!isSupport || linterType !== block.linterType) {
            // 这里就不做兼容了， 直接提示错误
            if (util.isVueLike(editor.doc.FileExtName)) {
                window.showInformationMessage('不要同时选择不同语言的代码来添加禁用规则');
            }
            return {blocks, errorLineCount: 0, allRules: new Set()};
        }


        block.rules = new Set([...block.rules, ...rules]);

        errorLineCount++;
    }

    return {blocks, errorLineCount, allRules: block.rules};
}

exports.addDisableComment = (editor, forEntireSelectionBlock = false) => {

    const errorMap = editor.errorMap;
    if (errorMap.size === 0) {
        return;
    }

    let blockData = null;

    if (forEntireSelectionBlock) {
        blockData = getErrorLineBlock(editor);
    }
    else {
        blockData = getErrorLineBlocks(editor);
    }
    const {errorLineCount, blocks, allRules} = blockData;

    if (errorLineCount === 0) {
        return;
    }

    // 不支持一次选择太多错误行， 避免滥用
    if (errorLineCount > 50) {
        window.showInformationMessage('您选择的错误行数超过了 50 行， 为避免误操作， 请缩小选区后再执行此命令');
        return;
    }

    if (allRules.size > 10) {
        window.showInformationMessage('您选择禁用的规则超过了 10 条， 为避免误操作， 请手动修复部分错误后再执行此命令');
        return;
    }

    // 为梳理出的各个代码库添加规则禁用注释
    editor.vscEditor.edit(editBuilder => {
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            const rules = [...block.rules];
            const disable = block.beginLineWhitespacePrefix + formatComment(block.linterType, rules, 'disable') + '\n';
            const enable = block.endLineWhitespacePrefix + formatComment(block.linterType, rules, 'enable') + '\n';

            const startLineIndex = block.beginLineIndex;
            const stopLineIndex = block.EndLineIndex;
            const start = new Position(startLineIndex, 0);
            // 从下一行的0开始
            const stop = new Position(stopLineIndex + 1, 0);

            // 此时的操作不会立即影响当前文档， 循环后续的 insert 不用考虑前面添加的行数
            editBuilder.insert(start, disable);
            editBuilder.insert(stop, enable);
        }
    });
};
