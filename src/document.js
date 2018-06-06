/**
 * @file: document.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-06-02 16:29:2
 * @last modified by: yanglei07
 * @last modified time: 2018-06-06 09:58:26
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';
const nodePathLib = require('path');
const {getFileExtName, isSupportFilePath} = require('./util.js');
const fecs = require('./fecs.js');

let documentMap = new Map();

/**
 * documet 辅助类， 主要负责调用 fecs 来做代码检查和格式化
 */
class Document {

    constructor(vscDocument) {
        this.fileName = vscDocument.fileName;
        this.vscDocument = vscDocument;
        this.checkPromise = null;
        this.formatPromise = null;

        this.checkFilePath = this.fileName;
        this.FileExtName = getFileExtName(vscDocument);
        this.updateCheckFilePath();
    }

    // 没有扩展名的文件（）可能会更改语言，这里需要修正
    updateCheckFilePath() {
        let old = this.checkFilePath;

        let ext = getFileExtName(this.vscDocument);
        let extWithPoint = nodePathLib.extname(this.fileName);
        if (!extWithPoint) {
            this.checkFilePath += '.' + ext;
        }
        else if (extWithPoint === '.') {
            this.checkFilePath += ext;
        }
        this.FileExtName = ext;

        return old !== this.checkFilePath;
    }

    check() {
        if (this.checkPromise) {
            return this.checkPromise;
        }

        this.updateCheckFilePath();

        if (this.FileExtName === 'vue' || this.FileExtName === 'san') {
            this.checkPromise = this.checkVueOrSan(this.vscDocument.getText(), this.checkFilePath);
        }
        else {
            this.checkPromise = fecs.check(this.vscDocument.getText(), this.checkFilePath);
        }

        this.checkPromise.then(() => {
            this.checkPromise = null;
        });

        return this.checkPromise;
    }

    format() {
        if (this.formatPromise) {
            return this.formatPromise;
        }

        this.updateCheckFilePath();

        if (this.FileExtName === 'vue' || this.FileExtName === 'san') {
            this.formatPromise = this.formatVueOrSan(this.vscDocument.getText(), this.checkFilePath);
        }
        else {
            this.formatPromise = fecs.format(this.vscDocument.getText(), this.checkFilePath);
        }

        this.formatPromise.then(() => {
            this.formatPromise = null;
        });

        return this.formatPromise;
    }

    checkVueOrSan(code, filePath) {
        let blocks = this.splitVueOrSanCode(code, filePath, true);

        let task = blocks.map(
            block => fecs.check(block.content, block.filePath)
                .then(errors => {
                    errors.forEach(err => {
                        err.line += block.lineBeginIndex - block.wrapLineCount;
                    });
                    return errors;
                })
        );

        return Promise.all(task).then(errList => {
            let list = [];
            errList.forEach(errors => {
                list = list.concat(errors);
            });
            return list;
        });
    }

    formatVueOrSan(code, filePath) {
        let blocks = this.splitVueOrSanCode(code, filePath);

        let task = blocks.map(
            block => fecs.format(block.content, block.filePath)
                .then(formatContent => {
                    block.formatContent = formatContent;
                    return block;
                })
        );

        return Promise.all(task).then(blockList => {
            let index = 0;
            let list = [];
            blockList.forEach(block => {
                if (index !== block.codeBegin) {
                    list.push(code.substr(index, block.codeBegin - index));
                    list.push(block.formatContent);
                    index = block.codeEnd;
                }
            });
            list.push(code.substr(index));
            return list.join('');
        });
    }

    splitVueOrSanCode(code, filePath, needWrapCode = false) {
        let vscDocument = this.vscDocument;

        let templateReg = /(<template(.*)>)([\s\S]+)(<\/template>)/g;
        let scriptReg = /(<script(.*)>)([\s\S]+)(<\/script>)/g;
        let styleReg = /(<style(.*)>)([\s\S]+)(<\/style>)/g;

        let blocks = [];
        let index = 0;

        // 暂时只对 js 进行 wrap
        function wrapCode(block) {
            let {content, lang} = block;
            if (lang === 'js') {
                let wrap = '/**\n * @file: x.js\n * @author: x\n*/';
                block.content = wrap + '\n' + content + '\n';
                block.wrapLineCount = wrap.split('\n').length;
            }
        }

        // 根据正则索引获取行号， 行号从 0 开始
        function getLineIndexByOffset(offset) {
            let position = vscDocument.positionAt(offset);
            let line = vscDocument.lineAt(position);
            return line.lineNumber;
        }
        function exec(reg, defaultLang) {
            let m = reg.exec(code);
            while (m) {
                let content = m[3];
                let codeBegin = m.index + m[1].length;
                let codeEnd = codeBegin + content.length;
                let lang = /\slang=['"](.*)['"]/.exec(m[2]) || [];
                lang = lang[1] || defaultLang;

                let mockFilePath = filePath + '-' + index + '.' + lang;

                if (isSupportFilePath(mockFilePath)) {

                    let block = {
                        filePath: mockFilePath,
                        codeBegin,
                        codeEnd,
                        lineBeginIndex: getLineIndexByOffset(codeBegin),
                        lineEndIndex: getLineIndexByOffset(codeEnd),
                        wrapLineCount: 0,
                        content,
                        lang
                    };

                    if (needWrapCode) {
                        wrapCode(block);
                    }

                    blocks.push(block);
                }

                m = reg.exec(code);
            }
        }

        exec(templateReg, 'html');
        exec(scriptReg, 'js');
        exec(styleReg, 'css');

        return blocks;
    }

    dispose() {
        this.vscDocument = null;
        this.checkPromise = null;
        this.formatPromise = null;
    }
}

exports.wrap = vscDocument => {
    let document = documentMap.get(vscDocument.fileName);

    if (!document) {
        document = new Document(vscDocument);
        documentMap.set(vscDocument.fileName, document);
    }
    return document;
};

exports.dispose = () => {

    let unusedList = [];
    for (let document of documentMap.values()) {
        if (document.vscDocument.isClosed) {
            unusedList.push(document);
        }
    }

    unusedList.forEach(document => {
        documentMap.delete(document.fileName);
        document.dispose();
    });
};
