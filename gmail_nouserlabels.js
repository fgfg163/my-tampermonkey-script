// ==UserScript==
// @name         gmail nouserlabels
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       fgfg163
// @match        https://mail.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#label/nouserlabels') {
            window.location.hash = '#search/has%3Anouserlabels'
        }
    })
})();
