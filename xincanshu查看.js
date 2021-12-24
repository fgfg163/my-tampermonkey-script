// ==UserScript==
// @name         xincanshu查看
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       fgfg163
// @match        https://www.xincanshu.com/cpu/**
// @icon         https://www.google.com/s2/favicons?domain=xincanshu.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var className1 = document.querySelector('[class^=denglutishi]').classList[0] || '';
    var className2 = document.querySelector('[class^=zheceng]').classList[0] || '';

    var style = document.createElement('style');
    style.type = 'text/css';
    style.rel = 'stylesheet';
    style.innerHTML = `.${className1},.${className2}{display: none !important;} #chart-wrapper{filter:none !important;}`
    document.head.appendChild(style);
})();
