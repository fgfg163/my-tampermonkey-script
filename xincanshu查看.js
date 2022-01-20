// ==UserScript==
// @name         xincanshu查看
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       fgfg163
// @match        https://www.xincanshu.com/**
// @icon         https://www.google.com/s2/favicons?domain=xincanshu.com
// @run-at       document-body
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    var style = document.createElement('style');
    style.type = 'text/css';
    style.rel = 'stylesheet';
    style.innerHTML = `[class^=denglutishi],[class^=zheceng]{display: none !important;} #chart-wrapper{filter:none !important;}`
    document.head.appendChild(style);
})();
