/**
 * @file: es6.js
 * @author: yanglei07
 * @description ..
 * @create data: 2018-06-05 12:03:9
 * @last modified by: yanglei07
 * @last modified time: 2018-06-05 12:11:4
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';
import * as _ from 'lodash';

function noop(x = 1) {
    return x;
}
async function x() {
    let t = await Promise.resolve(3);
    return t;
}
function* n() {
    yield 1;
}

let obj = {a: 1, e: 5};
let {a, e} = obj;
const b = 2;

class C {
    constructor() {
        this.a = a;
        this.b = b;

        this.isRegExp = _.isRegExp(a);
        noop();
    }
}

export default class D extends C {
    constructor() {
        super();
        this.c = 3;
        this.e = e;
    }
}

let map = new Map();
for (let item of map) {
    x(item);
}

((...args) => {
    n(...args);
})();

