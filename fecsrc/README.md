# Linter 配置文件

## `.fecsrc` 文件

`.fecsrc` 文件官方配置说明看[这里](https://github.com/ecomfe/fecs/wiki/Configuration).

推荐使用这份配置 [fecsrc.json](./fecsrc.json) ，  搬运自[这里](https://github.com/ecomfe/eslint-config/blob/master/strict.js)，略做了一些修改。

> 直接将文件 copy 到期望的目录下， 并改名为 `.fecsrc` 即可。

## `tslint.json`

包含以下规则：

- [tslint](https://palantir.github.io/tslint/rules/)
- [tslint-eslint-rules](https://github.com/buzinas/tslint-eslint-rules)
- [tslint-react](https://github.com/palantir/tslint-react)

> 直接将 [tslint.json](./tslint.json) 文件 copy 到期望的目录下即可。

## `tseslint.json`

使用 eslint 来检查 typescript (_详情参考[typescript-eslint](https://github.com/typescript-eslint/typescript-eslint)_)， 这是对应的配置文件。

欢迎提 [issue](https://github.com/l5oo00/vscode-fecs-plugin/issues/new) 或 pr 来更新规则~
