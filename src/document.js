/**
 * @file: document.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-06-02 16:29:2
 * @last modified by: yanglei07
 * @last modified time: 2018-06-03 14:15:37
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';
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
    }
    check() {
        if (this.checkPromise) {
            return this.checkPromise;
        }

        this.checkPromise = fecs.check(this.vscDocument.getText(), this.fileName);

        this.checkPromise.then(() => {
            this.checkPromise = null;
        });

        return this.checkPromise;
    }
    format() {
        if (this.formatPromise) {
            return this.formatPromise;
        }

        this.formatPromise = fecs.format(this.vscDocument.getText(), this.fileName);
        return this.formatPromise;
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
