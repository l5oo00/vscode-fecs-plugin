/**
 * @file: statusBarItemWidthFix.js
 * @author: yanglei07
 * @description ..
 * @create data: 2017-06-09 20:57:21
 * @last modified by: yanglei07
 * @last modified time: 2018-06-06 09:30:21
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';


(function () {
    let domReady = (function () {
        function execFn(fn) {
            try {
                fn();
            }
            catch (e) {}
        }
        let isReady = false;
        let fnArr = [];
        window.addEventListener('DOMContentLoaded', function (e) {
            isReady = true;

            let fn;
            while (fnArr.length) {
                fn = fnArr.shift();
                execFn(fn);
            }
        });

        function domReady(fn) {
            if (isReady) {
                execFn(fn);
            }
            else {
                fnArr.push(fn);
            }
        }
        return domReady;
    })();

    function start() {
        let bar = document.getElementById('workbench.parts.statusbar');

        if (!bar) {
            setTimeout(start, 1000);
            return;
        }
        let timer;
        let observer;

        function findBarItem() {
            let msgItem = bar.querySelector('[title^="fecs-msg:"]');
            let ruleItem = bar.querySelector('[title^="fecs-rule:"]');

            if (msgItem && ruleItem) {
                // observer.disconnect();
                fecsStatusBarFix(msgItem, ruleItem, bar);
            }
        }
        observer = new MutationObserver(function (mutations) {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(findBarItem, 100);
        });
        observer.observe(bar, {
            childList: true,
            subtree: true
        });
    }
    function fecsStatusBarFix(msgItem, ruleItem) {

        if (msgItem.offsetTop < 10 && ruleItem.offsetTop < 10) {
            return;
        }

        let s = msgItem.style;
        s.display = 'inline-block';
        s.overflow = 'hidden';
        s.textOverflow = 'ellipsis';

        let w = Math.min(500, msgItem.offsetWidth);
        s.width = w + 'px';

        while (msgItem.offsetTop > 10 && w > 0 && ruleItem.offsetTop > 10) {
            if (w >= 400) {
                w -= 100;
            }
            else if (w >= 250) {
                w -= 50;
            }
            else {
                w -= 10;
            }

            s.width = (--w) + 'px';
        }

    }
    domReady(start);
})();
