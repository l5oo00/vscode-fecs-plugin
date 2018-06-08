# vscode-fecs-plugin

A better fecs extension for vscode. This is inspired by [SublimeLinter-contrib-fecs](https://github.com/robbenmu/SublimeLinter-contrib-fecs) and [VScode-fecs](https://github.com/MarxJiao/VScode-fecs).

## Install

Install [this extension](https://marketplace.visualstudio.com/items?itemName=l5oo00.vscode-fecs-plugin): `ext install vscode-fecs-plugin`

## Features


### Fecs Format

- Run command: `vscode-fecs-plugin: Format`
- Shortcuts: `cmd+shift+r`

### Fecs Check

- Default enable check
  - can be disabled by configuring `vscode-fecs-plugin.disableCheck` to `true`
- Support [`.fecsrc`](https://github.com/ecomfe/fecs/wiki/Configuration)
- Support disable/enable check, run command:
  - `vscode-fecs-plugin: Disable check`
  - `vscode-fecs-plugin: Enable check`
- Support add inline disable rule comments quickly (*only support `eslint`*)
  - `vscode-fecs-plugin: Add Disable Rule Comments`
  > **this feature is dangerous, please use it with caution**
- Support ignore `/* eslint-disalbe */` by configuring `vscode-fecs-plugin.ignoreGlobalEslintDisalbe` to `true`
- Support search rule in borwser
  - `vscode-fecs-plugin.search-rule-in-browser`
  - click the error message in statusbar
- [Demo](demo.md)
  ![javascript](images/js.png)

> **Attention:** the gutter icon for this extension will overlap the 'debug break point' icon.

> **Attention:** Sometimes the error message is too long to display in statusbar, maybe you need [this extension](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css) and this script([script/statusBarItemWidthFix.js](https://github.com/l5oo00/vscode-fecs-plugin/blob/master/scripts/statusBarItemWidthFix.js)).

### Support File Type

> Use the extension name to do support detection. When the extension name is empty, use the language id set by the current file to detect.

- javascript
- css
- less
- html
- vue
- san

## Extension Settings

This extension contributes the following settings:

- `vscode-fecs-plugin.disableCheck`: Controls if disable check by default when vscode start/restart/reload.
- `vscode-fecs-plugin.ignoreGlobalEslintDisalbe`: Controls if ignore `/* eslint-disalbe */` in js file.
- `vscode-fecs-plugin.en`: Controls if use English in output.
- `vscode-fecs-plugin.level`: Fecs check level. Value is 0 1 or 2 .
- `vscode-fecs-plugin.jsLikeExt`: Specified 'js like' files extension that can use fecs.
- `vscode-fecs-plugin.cssLikeExt`: Specified 'css like' files extension that can use fecs.
- `vscode-fecs-plugin.htmlLikeExt`: Specified 'html like' files extension that can use fecs.
- `vscode-fecs-plugin.excludePaths`: Uncheck the files in these directory.
- `vscode-fecs-plugin.excludeFileNameSuffixes`: Uncheck the files with these suffixes.
- `vscode-fecs-plugin.searchUrl`: Search engine url, replace query by `${query}`, used to search for error rule.

### For more information

* [FECS](http://fecs.baidu.com/)

**Enjoy!**
