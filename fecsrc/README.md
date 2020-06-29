# Linter 配置文件

## `.fecsrc` 文件

`.fecsrc` 文件官方配置说明看[这里](https://github.com/ecomfe/fecs/wiki/Configuration).

推荐使用这份配置 [fecsrc.json](./fecsrc.json) ，  搬运自[这里](https://github.com/ecomfe/eslint-config/blob/master/strict.js)，略做了一些修改。

> 直接将文件 copy 到期望的目录下， 并改名为 `.fecsrc` 即可。

## `tseslint.js`

使用 eslint 来检查 typescript (_详情参考[typescript-eslint](https://github.com/typescript-eslint/typescript-eslint)_)， 这是对应的配置文件，直接 copy 的 [@ecomfe/eslint-config](https://github.com/ecomfe/eslint-config)。

> 本来是把 @ecomfe/eslint-config 作为依赖安装的， 但是它依赖 eslint v6+ ， v6+ 又会报错， 懒得追了， 就先用  eslint v5 了。
