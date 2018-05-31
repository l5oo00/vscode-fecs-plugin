/**
 * @file: context.js
 * @author: yanglei07
 * @description 插件 context
 * @create data: 2018-05-31 19:28:53
 * @last modified by: yanglei07
 * @last modified time: 2018-05-31 19:30:28
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';


let ctx = null;

exports.set = context => {
    ctx = context;
};
exports.get = () => ctx;
