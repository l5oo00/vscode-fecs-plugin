# vscode-fecs-plugin

A better fecs extension for vscode. This is inspired by [SublimeLinter-contrib-fecs](https://github.com/robbenmu/SublimeLinter-contrib-fecs) and [VScode-fecs](https://github.com/MarxJiao/VScode-fecs).

## Install

Install [this extension](https://marketplace.visualstudio.com/items?itemName=l5oo00.vscode-fecs-plugin): `ext install vscode-fecs-plugin`

## Features


### Fecs Format

- Run command: `vscode-fecs-plugin: Format`
  - shortcuts: `cmd+shift+r`
- Support auto format on save.
  - can be enable by configuring `vscode-fecs-plugin.autoFormatOnSave` to `true`

### Fecs Check

- Default enable check
  - can be disabled by configuring `vscode-fecs-plugin.disableCheck` to `true`
- Support [`.fecsrc` & `tslint.json`](https://github.com/l5oo00/vscode-fecs-plugin/blob/master/fecsrc/README.md)
- Support disable/enable check, run command:
  - `vscode-fecs-plugin: Disable check`
  - `vscode-fecs-plugin: Enable check`
- Support add inline disable rule comments quickly (*only support `eslint`*)
  - `vscode-fecs-plugin: Add disable rule comments`
  - `vscode-fecs-plugin: Add disable rule comments for entire selection block`
  > **this feature is dangerous, please use it with caution**
- Support ignore `/* eslint-disalbe */`
  - can be disabled by configuring `vscode-fecs-plugin.ignoreGlobalEslintDisalbe` to `false`
- Support search rule in borwser
  - `vscode-fecs-plugin: Search rule in browser`
  - click the error message in statusbar
- [Demo](https://github.com/l5oo00/vscode-fecs-plugin/blob/master/demo.md)
  ![javascript](images/js.png)

> **Attention:** the gutter icon for this extension will overlap the 'debug break point' icon.

> **Attention:** Sometimes the error message is too long to display in statusbar, maybe you need [this extension](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css) and this script([script/statusBarItemWidthFix.js](https://github.com/l5oo00/vscode-fecs-plugin/blob/master/scripts/statusBarItemWidthFix.js)).

### Support File Type

> Use the extension name to do support detection. When the extension name is empty, use the language id set by the current file to detect.

- javascript
- typescript
- css
- less
- html
- vue like file
  - vue
  - san
  - atom
  - any other vue like files ...

## Extension Settings

This extension contributes the following settings:

- `vscode-fecs-plugin.disableCheck`: Controls if disable check by default when vscode start/restart/reload.
- `vscode-fecs-plugin.ignoreGlobalEslintDisalbe`: Controls if ignore `/* eslint-disalbe */` in js file.
- `vscode-fecs-plugin.en`: Controls if use English in output.
- `vscode-fecs-plugin.level`: Fecs check level. Value is 0 1 or 2 .
- `vscode-fecs-plugin.jsLikeExt`: Specified 'js like' files extension that can use fecs.
- `vscode-fecs-plugin.cssLikeExt`: Specified 'css like' files extension that can use fecs.
- `vscode-fecs-plugin.htmlLikeExt`: Specified 'html like' files extension that can use fecs.
- `vscode-fecs-plugin.vueLikeExt`: Specified 'vue like' files extension that can use fecs.
- `vscode-fecs-plugin.excludePaths`: Uncheck the files in these directory.
- `vscode-fecs-plugin.excludeFileNameSuffixes`: Uncheck the files with these suffixes.
- `vscode-fecs-plugin.searchUrl`: Search engine url, replace query by `${query}`, used to search for error rule.
- `vscode-fecs-plugin.autoFormatOnSave`: Controls if auto format on save a document.

### For more information

* [FECS](http://fecs.baidu.com/)

**Enjoy!**
