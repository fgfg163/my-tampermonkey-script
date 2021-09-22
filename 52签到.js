// ==UserScript==
// @name         52签到
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       fgfg163
// @run-at       document-end
// @match        https://www.52pojie.cn
// @icon         https://www.52pojie.cn/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const iframe = document.createElement('iframe');
    iframe.src = '/home.php?mod=task&do=apply&id=2';
    iframe.style='height: 0;width: 0;position:fixed;right: -100%';
    iframe.onload = () => {
        document.body.removeChild(iframe);
    };
    document.body.appendChild(iframe);
})();
