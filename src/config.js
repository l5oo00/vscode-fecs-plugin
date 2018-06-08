/**
 * @file: config.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-05-31 17:07:41
 * @last modified by: yanglei07
 * @last modified time: 2018-06-08 10:39:23
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';

const vscode = require('vscode');

const workspace = vscode.workspace;

let configuration = workspace.getConfiguration('vscode-fecs-plugin');


let config = {
    disableCheck: configuration.get('disableCheck', false),
    ignoreGlobalEslintDisalbe: configuration.get('ignoreGlobalEslintDisalbe', true),
    en: configuration.get('en', false),
    level: configuration.get('level', 0),
    errorColor: '#f00',
    warningColor: '#ddb700',
    typeMap: new Map(),
    excludePaths: configuration.get('excludePaths', []),
    excludeFileNameSuffixes: configuration.get('excludeFileNameSuffixes', []),
    searchUrl: configuration.get('searchUrl', '')
};

['js', 'css', 'html'].forEach(type => {
    configuration.get(type + 'LikeExt', []).forEach(ext => {
        config.typeMap.set(ext, type);
    });
});

module.exports = config;
