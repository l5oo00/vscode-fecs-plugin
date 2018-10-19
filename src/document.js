/**
 * @file: document.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-06-02 16:29:2
 * @last modified by: l5oo00
 * @last modified time: 2018-10-16 15:13:58
 */

/* global  */
'use strict';
const nodePathLib = require('path');
const {getFileExtName, isSupportFilePath, isVueLike} = require('./util.js');
const linter = require('./linter/index.js');

const documentMap = new Map();

/**
 * documet 辅助类， 主要负责调用 linter 来做代码检查和格式化
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
            this.checkPromise = linter.check(this.vscDocument.getText(), this.checkFilePath);
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
            this.formatPromise = linter.format(this.vscDocument.getText(), this.checkFilePath);
        }

        this.formatPromise.then(() => {
            this.formatPromise = null;
        });

        return this.formatPromise;
    }

    checkVueLike(code, filePath) {
        const blocks = this.splitVueLikeCode(code, filePath, true);

        const task = blocks.map(
            block => linter.check(block.content, block.filePath)
                .then(errors => {
                    const diff = block.lineBeginIndex - block.wrapLineCount;
                    errors.forEach(err => {
                        err.line += diff;
                        err.endLine += diff;
                        if (block.indent) {
                            err.column += block.indent;
                            err.endColumn += block.indent;
                        }
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

        const task = blocks
            .filter(block => block.tagName !== 'template') // template 标签里的内容格式化有问题， 这里跳过不处理
            .map(
                block => linter.format(block.content, block.filePath)
                    .then(formatContent => {
                        if (block.indent && block.indentChar) {
                            let join = '\n';
                            if (/\r\n/.test(formatContent)) {
                                join = '\r\n';
                            }

                            formatContent = formatContent
                                .split(join)
                                .map(line => line ? block.indentChar.repeat(block.indent) + line : '')
                                .join(join);

                        }
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

        // template下面可能会嵌套， 这里使用贪婪匹配
        const templateReg = /(<template(.*)>)([\s\S]+)(<\/template>)/g;
        const scriptReg = /(<script(.*)>)([\s\S]+?)(<\/script>)/g;
        const styleReg = /(<style(.*)>)([\s\S]+?)(<\/style>)/g;

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

        function stripIndent(content) {
            let join = '\n';
            if (/\r\n/.test(content)) {
                join = '\r\n';
            }

            let lines = content.split(join);
            let indent = -1;
            let indentChar = '';
            let code = content;

            lines.forEach(line => {
                let newLine = line.trim();
                if (!newLine) {
                    return;
                }

                let index = line.indexOf(newLine);

                if (!indentChar && index > 0) {
                    indentChar = line[0];
                }

                indent = indent === -1 ? index : Math.min(indent, index);
            });

            if (indent > 0) {
                code = lines.map(line => line.substr(indent)).join(join);
            }

            if (indent === -1) {
                indent = 0;
            }
            return {indent, code, indentChar};
        }

        // 根据正则索引获取行号， 行号从 0 开始
        function getLineIndexByOffset(offset) {
            const position = vscDocument.positionAt(offset);
            const line = vscDocument.lineAt(position);
            return line.lineNumber;
        }
        function exec(reg, defaultLang, tagName) {
            let m = reg.exec(code);
            let index = 0;
            while (m) {
                index++;
                const content = m[3];
                const codeBegin = m.index + m[1].length;
                const codeEnd = codeBegin + content.length;
                let lang = /\slang=['"](.*)['"]/.exec(m[2]) || [];
                lang = lang[1] || defaultLang;

                const {indent, code: newCode, indentChar} = stripIndent(content);

                const mockFilePath = filePath + '-' + defaultLang + '-' + index + '.' + lang;

                if (isSupportFilePath(mockFilePath)) {

                    const block = {
                        filePath: mockFilePath,
                        codeBegin,
                        codeEnd,
                        lineBeginIndex: getLineIndexByOffset(codeBegin),
                        lineEndIndex: getLineIndexByOffset(codeEnd),
                        wrapLineCount: 0,
                        content: newCode,
                        indent,
                        indentChar,
                        lang,
                        tagName
                    };

                    if (needWrapCode) {
                        wrapCode(block);
                    }

                    blocks.push(block);
                }

                m = reg.exec(code);
            }
        }

        exec(templateReg, 'html', 'template');
        exec(scriptReg, 'js', 'script');
        exec(styleReg, 'css', 'style');

        // 按顺序排序， 主要是为了后续格式化后需要按顺序做拼接
        blocks.sort((a, b) => {
            return a.codeBegin - b.codeBegin;
        });

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
