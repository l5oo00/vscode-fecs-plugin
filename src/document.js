/**
 * @file: document.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-06-02 16:29:2
 * @last modified by: yanglei07
 * @last modified time: 2018-06-28 10:38:9
 */

/* global  */
'use strict';
const nodePathLib = require('path');
const {getFileExtName, isSupportFilePath, isVueLike} = require('./util.js');
const fecs = require('./fecs.js');

const documentMap = new Map();

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
        const old = this.checkFilePath;

        const ext = getFileExtName(this.vscDocument);
        const extWithPoint = nodePathLib.extname(this.fileName);
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

        if (isVueLike(this.FileExtName)) {
            this.checkPromise = this.checkVueLike(this.vscDocument.getText(), this.checkFilePath);
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

        if (isVueLike(this.FileExtName)) {
            this.formatPromise = this.formatVueLike(this.vscDocument.getText(), this.checkFilePath);
        }
        else {
            this.formatPromise = fecs.format(this.vscDocument.getText(), this.checkFilePath);
        }

        this.formatPromise.then(() => {
            this.formatPromise = null;
        });

        return this.formatPromise;
    }

    checkVueLike(code, filePath) {
        const blocks = this.splitVueLikeCode(code, filePath, true);

        const task = blocks.map(
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

    formatVueLike(code, filePath) {
        const blocks = this.splitVueLikeCode(code, filePath);

        const task = blocks.map(
            block => fecs.format(block.content, block.filePath)
                .then(formatContent => {
                    block.formatContent = formatContent;
                    return block;
                })
        );

        return Promise.all(task).then(blockList => {
            let index = 0;
            const list = [];
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

    splitVueLikeCode(code, filePath, needWrapCode = false) {
        const vscDocument = this.vscDocument;

        const templateReg = /(<template(.*)>)([\s\S]+)(<\/template>)/g;
        const scriptReg = /(<script(.*)>)([\s\S]+)(<\/script>)/g;
        const styleReg = /(<style(.*)>)([\s\S]+)(<\/style>)/g;

        const blocks = [];

        // 暂时只对 js 进行 wrap
        function wrapCode(block) {
            const {content, lang} = block;
            if (lang === 'js') {
                const wrap = '/**\n * @file: x.js\n * @author: x\n*/';
                block.content = wrap + '\n' + content + '\n';
                block.wrapLineCount = wrap.split('\n').length;
            }
        }

        // 根据正则索引获取行号， 行号从 0 开始
        function getLineIndexByOffset(offset) {
            const position = vscDocument.positionAt(offset);
            const line = vscDocument.lineAt(position);
            return line.lineNumber;
        }
        function exec(reg, defaultLang) {
            let m = reg.exec(code);
            let index = 0;
            while (m) {
                index++;
                const content = m[3];
                const codeBegin = m.index + m[1].length;
                const codeEnd = codeBegin + content.length;
                let lang = /\slang=['"](.*)['"]/.exec(m[2]) || [];
                lang = lang[1] || defaultLang;

                const mockFilePath = filePath + '-' + defaultLang + '-' + index + '.' + lang;

                if (isSupportFilePath(mockFilePath)) {

                    const block = {
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

/**
 * 对 TextDocument 进行封装
 *
 * @param {TextDocument} vscDocument vscode 的  TextDocument 实例
 * @return {Document} 封装的 Document 实例
 */
exports.wrap = vscDocument => {
    let document = documentMap.get(vscDocument.fileName);

    if (!document) {
        document = new Document(vscDocument);
        documentMap.set(vscDocument.fileName, document);
    }
    return document;
};

exports.dispose = () => {

    const unusedList = [];
    for (const document of documentMap.values()) {
        if (document.vscDocument.isClosed) {
            unusedList.push(document);
        }
    }

    unusedList.forEach(document => {
        documentMap.delete(document.fileName);
        document.dispose();
    });
};
