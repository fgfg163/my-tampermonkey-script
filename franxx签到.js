// ==UserScript==
// @name         franxx签到
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       fgfg163
// @run-at       document-end
// @match        https://www.franxx.cloud/user
// @icon         https://www.franxx.cloud/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    setTimeout(() => {
        window.index.checkin()
    }, 500)
})();
