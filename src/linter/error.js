/**
 * @file: error.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-07-11 19:34:41
 * @last modified by: yanglei07
 * @last modified time: 2018-07-12 09:47:46
 */

/* global  */

'use strict';

// // 统一错误数据格式
// // Demo
// {
//     "line": 16,
//     "column": 13,
//     "severity": 1,
//     "message": "  JS998: Assignment to property of function parameter 'req'.",
//     "rule": "no-param-reassign",
//     "info": "→ line  16, col  13,   JS998: Assignment to property of function parameter 'req'.",
//     "linterType": "eslint"
// }

exports.format = (line, column, severity, message, rule, linterType, endLine = -1, endColumn = -1) => {
    return {
        line, column, severity, message, rule, linterType,
        endLine: endLine === -1 ? line : endLine,
        endColumn: endColumn === -1 ? column : endColumn
    };
};
