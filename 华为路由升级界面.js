// ==UserScript==
// @name         华为路由升级界面
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       fgfg163
// @run-at       document-body
// @match        http://192.168.8.1/html/upgraderedirect.html*
// @icon         http://192.168.8.1/favicon.ico
// @grant        none
// ==/UserScript==


(function() {
    'use strict';
    const s = document.createElement('style');
    s.type = 'text/css';
    s.innerHTML = '#upgrade_detect_new_version,#index_autoUpg{display:none !important;}';
    document.head.appendChild(s);
})();
