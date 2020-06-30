# vscode-fecs-plugin

一个凑合能用的 [FECS](https://fecs.baidu.com/) 的 vscode 扩展。 致敬 [SublimeLinter-contrib-fecs](https://github.com/robbenmu/SublimeLinter-contrib-fecs) 和 [VScode-fecs](https://github.com/MarxJiao/VScode-fecs)。

## 安装

打开 [这个页面](https://marketplace.visualstudio.com/items?itemName=l5oo00.vscode-fecs-plugin) 点击 **Install** 按钮就行安装，  或在 vscode 里的命令面板输入 `ext install vscode-fecs-plugin` 进行安装。

## 功能

### Fecs 格式化

- 执行命令: `vscode-fecs-plugin: Format`
  - 快捷键: `cmd+shift+r`
- 支持保存时自动格式化
  - 配置 `vscode-fecs-plugin.autoFormatOnSave` to `true` 即可启用

### Fecs 检查

- 默认启用
  - 可以禁用， 配置 `vscode-fecs-plugin.disableCheck` to `true` 即可
- 支持 [`.fecsrc`](https://github.com/l5oo00/vscode-fecs-plugin/blob/master/fecsrc/README.md)
- 支持临时禁用、启用， 执行命令:
  - `vscode-fecs-plugin: Disable check`
  - `vscode-fecs-plugin: Enable check`
- 支持对选中的代码块快速添加豁免注释 (*仅支持 `eslint`*)， 若没有选中代码， 则仅处理光标所在行
  - 执行命令 `vscode-fecs-plugin: Add disable rule comments`: 仅在有错误的行前后添加注释
  - 执行命令 `vscode-fecs-plugin: Add disable rule comments for entire selection block`: 在整个代码块前后添加注释
  - 鼠标 hover 到报错处点击**快速修复**， 可以给该行添加豁免注释
  > **不要滥用！！！**
- 默认会忽略 `/* eslint-disalbe */`
  - 可以配置 `vscode-fecs-plugin.ignoreGlobalEslintDisalbe` to `false` 来禁用这个功能
- 通过以下任一方式可以打开浏览器搜索命中的错误规则
  - 执行命令 `vscode-fecs-plugin: Search rule in browser`
  - 点击底部状态栏的错误信息
- [Demo](https://github.com/l5oo00/vscode-fecs-plugin/blob/master/demo.md)
  ![javascript](images/js.png)

> **注意:** 若在 vscode 里断点调试代码， 这些小红点、小黄点可能把断点的那个小圆点遮住。

有时候状态栏的错误信息可能因为太长而被挤下去， 导致看不到， 这时你可以安装[这个插件](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css)， 同时使用这个脚本 ([script/statusBarItemWidthFix.js](https://github.com/l5oo00/vscode-fecs-plugin/blob/master/scripts/statusBarItemWidthFix.js)) 来缓解这个问题。

### 支持的文件类型

> 基于文件的扩展名来做支持判断， 若扩展名为空， 以当前文件的 language id 来判断。

- javascript
- typescript

  > 使用 [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) 来做检测

- css
- less
- html
- 各种 Vue 单文件组件格式的文件：
  - vue
  - san
  - atom

可以通过 `jsLikeExt`, `cssLikeExt`, `htmlLikeExt`, `vueLikeExt` 等配置来支持更多的文件格式， 具体参考下面的**配置说明**。

### 支持仅针对特定的 git 仓库启用此插件

若配置了 `supportByGitDomainTest` 字段， 则此插件只会对 git 仓库的文件进行检测， 且仓库的远程 url 必须匹配这个配置项里的其中一项。

示例:

- `supportByGitDomainTest: ['.github.com']`: 只对 github 的代码库启用
- `supportByGitDomainTest: ['.gitlab.com']`: 只对 gitlab 的代码库启用
- `supportByGitDomainTest: ['.github.com', '.gitlab.com']`: 同时对 github/gitlab 的代码库启用

## 配置说明

插件支持以下配置项：

- `vscode-fecs-plugin.disableCheck`: 是否默认禁用检测， 默认为 `false`, 不禁用
- `vscode-fecs-plugin.ignoreGlobalEslintDisalbe`: 是否忽略 `/* eslint-disalbe */` 注释， 默认为 `true`, 忽略
- `vscode-fecs-plugin.en`: 是否使用英文输出错误信息， 默认为 `false`, 使用中文输出
- `vscode-fecs-plugin.level`: 输出错误级别， 0(_both_), 1(_warn_), 2(_error_), 默认为 0
- `vscode-fecs-plugin.jsLikeExt`: 配置类似 js 的文件类型
- `vscode-fecs-plugin.cssLikeExt`: 配置类似 css 的文件类型
- `vscode-fecs-plugin.htmlLikeExt`: 配置类似 html 的文件类型
- `vscode-fecs-plugin.vueLikeExt`: 配置类似 vue 的文件类型
- `vscode-fecs-plugin.supportByGitDomainTest`: 支持仅针对特定的 git 仓库启用此插件
- `vscode-fecs-plugin.excludePaths`: 不做检查的代码路径， 比如 `dist`, `output` 等
- `vscode-fecs-plugin.excludeFileNameSuffixes`: 不做检查的文件名后缀， 比如 `.min.js` 等
- `vscode-fecs-plugin.searchUrl`: 发起搜索的 url， 会把其中的 `${query}` 替换为命中的规则
- `vscode-fecs-plugin.autoFormatOnSave`: 是否在保存文件时自动格式化， 默认为 `false`, 不保存

**加油！**
