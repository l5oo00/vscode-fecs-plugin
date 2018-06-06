/**
 * @file: comment.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-06-06 13:42:14
 * @last modified by: yanglei07
 * @last modified time: 2018-06-06 13:48:52
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';
const vscode = require('vscode');
const Position = vscode.Position;

exports.addDisableComment = editor => {
    if (!editor.doc) {
        return; // 好像不用这个判断
    }

    let errorMap = editor.errorMap;
    if (errorMap.size === 0) {
        return;
    }

    let selection = editor.vscEditor.selection;
    let start = selection.anchor;
    let stop = selection.active;
    if (selection.isReversed) {
        start = selection.active;
        stop = selection.anchor;
    }

    let startLine = editor.doc.vscDocument.lineAt(start);
    let stopLine = editor.doc.vscDocument.lineAt(stop);

    // 梳理代码块， 只包含有错误的代码块
    let blocks = [];
    let block = null;
    let lineCount = 0;
    let allRules = new Set();
    let vscDocument = editor.doc.vscDocument;
    for (let i = startLine.lineNumber; i <= stopLine.lineNumber; i++) {
        let errors = errorMap.get(i);
        if (!errors || errors.length === 0) {
            continue;
        }

        let rules = new Set();
        let isEslint = errors.every(err => {
            rules.add(err.rule);
            return err.linterType === 'eslint';
        });
        if (!isEslint) {
            continue;
        }

        if (!block || block.EndLineIndex + 1 < i) {
            let beginLine = vscDocument.lineAt(i);
            block = {
                beginLineIndex: i,
                EndLineIndex: i,
                beginLineWhitespacePrefix: beginLine.text.substr(0, beginLine.firstNonWhitespaceCharacterIndex)
                    || '',
                endLineWhitespacePrefix: beginLine.text.substr(0, beginLine.firstNonWhitespaceCharacterIndex) || '',
                rules: new Set()
            };
            blocks.push(block);
        }

        block.rules = new Set([...block.rules, ...rules]);
        block.EndLineIndex = i;
        allRules = new Set([...allRules, ...rules]);

        let endLine = vscDocument.lineAt(i);
        block.endLineWhitespacePrefix = endLine.text.substr(0, endLine.firstNonWhitespaceCharacterIndex);

        lineCount++;
    }

    // 不支持一次选择太多错误行， 避免滥用
    if (lineCount > 50) {
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
            let block = blocks[i];
            let rules = [...block.rules].join(', ');
            let disable = block.beginLineWhitespacePrefix + '/* eslint-disable ' + rules + ' */\n';
            let enable = block.endLineWhitespacePrefix + '/* eslint-enable ' + rules + ' */\n';

            let startLineIndex = block.beginLineIndex;
            let stopLineIndex = block.EndLineIndex;
            let start = new Position(startLineIndex, 0);
            // 从下一行的0开始
            let stop = new Position(stopLineIndex + 1, 0);

            // 此时的操作不会立即影响当前文档， 循环后续的 insert 不用考虑前面添加的行数
            editBuilder.insert(start, disable);
            editBuilder.insert(stop, enable);
        }
    });
};
