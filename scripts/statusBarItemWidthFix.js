/**
 * @file: statusBarItemWidthFix.js
 * @author: yanglei07
 * @description ..
 * @create data: 2017-06-09 20:57:21
 * @last modified by: yanglei07
 * @last modified time: 2017-06-09 20:57:21
 */

/* global  */

/* eslint-disable fecs-camelcase */
/* eslint-enable fecs-camelcase */
'use strict';


(function () {
    var domReady = (function () {
        function execFn(fn) {
            try {
                fn();
            }
            catch (e) {}
        }
        var isReady = false;
        var fnArr = [];
        window.addEventListener('DOMContentLoaded', function (e) {
            isReady = true;

            var fn;
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
        var bar = document.getElementById('workbench.parts.statusbar');

        if (!bar) {
            setTimeout(start, 1000);
            return;
        }
        var timer;
        var observer;

        function findBarItem() {
            var item = bar.querySelector('[title^="fecs:"]');

            if (item) {
                // observer.disconnect();
                fecsStatusBarFix(item, bar);
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
    function fecsStatusBarFix(item) {

        if (item.offsetTop === 0) {
            return;
        }

        var s = item.style;
        s.display = 'inline-block';
        s.overflow = 'hidden';
        s.textOverflow = 'ellipsis';

        var w = Math.min(500, item.offsetWidth);
        s.width = w + 'px';

        while (item.offsetTop > 10 && w > 0) {
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
