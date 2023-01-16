// ==UserScript==
// @name         知乎专栏直接显示高清大图
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  知乎专栏直接显示高清大图，拒绝懒加载
// @author       fgfg163
// @match        https://zhuanlan.zhihu.com/p/*
// @icon         https://static.zhihu.com/heifetz/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var config = { attributes: true, childList: false, subtree: false };
    var observer = new MutationObserver(function(mutationsList) {
        for(var mutation of mutationsList) {
            if (mutation.type === 'attributes') {
                if (mutation.attributeName === 'src') {
                    if (/\.webp$/.test(mutation.target.src) && mutation.target.getAttribute('data-original')) {
                        mutation.target.src = mutation.target.getAttribute('data-original');
                    }
                }
            }
        }
    });

    var allImg = document.querySelectorAll('img[data-original]');
    allImg.forEach(function(imgDom) {
        imgDom.src = imgDom.getAttribute('data-original');
        imgDom.setAttribute('data-lazy-status', 'ok');
        observer.observe(imgDom, config);
    });
})();
