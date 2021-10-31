// ==UserScript==
// @name         自动跳过华为路由升级
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to take over the world!
// @author       fgfg163
// @run-at       document-idle
// @match        http://192.168.8.1/html/upgraderedirect.html*
// @icon         http://192.168.8.1/favicon.ico
// @grant        none
// ==/UserScript==


(function() {
    'use strict';
    function setRunDate() {
        if (window.localStorage){
            window.localStorage.setItem('rundate', '' + Date.now());
        }
    }
    function getRunDate() {
        if (window.localStorage){
            return 1 * window.localStorage.getItem('rundate');
        }
        return 0;
    }

    function runIgnore() {
        window.EMUI && window.EMUI.upgradeRedirectIgnor && window.EMUI.upgradeRedirectIgnor.redirectIgnor && window.EMUI.upgradeRedirectIgnor.redirectIgnor();
        setRunDate();
        setTimeout(function() {
            window.location.replace('/html/upgraderedirect.html');
        }, 0)
    }

    var showTimeDiv = document.createElement('div');
    showTimeDiv.style = 'display:block !important;';
    showTimeDiv.innerHTML = (new Date()).toString();
    document.body.appendChild(showTimeDiv);

    if (window.location.href.indexOf('randid=') > -1 || Date.now() - getRunDate() > 3600000) {
        showTimeDiv.innerHTML = (new Date()).toString();
        runIgnore();
    } else {
        setInterval(function () {
            showTimeDiv.innerHTML = (new Date()).toString();
            if (Date.now() - getRunDate() > 3600000) {
                runIgnore();
            }
        }, 10000);
    }
})();
