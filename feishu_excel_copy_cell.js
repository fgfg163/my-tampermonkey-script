// ==UserScript==
// @name         feishu excel copy
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       fgfg163
// @match        https://bytedance.feishu.cn/sheets/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=feishu.cn
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            const currentActive = document.activeElement;
            const inputDom = document.createElement('textarea');
            inputDom.value = text;
            inputDom.style.opacity = 0;
            inputDom.style.position = 'fixed';
            inputDom.style.top = '-999999px';
            document.body.appendChild(inputDom);
            inputDom.focus();
            inputDom.select();
            return new Promise(function(resolve, reject) {
                document.execCommand('copy') ? resolve() : reject();
                currentActive && currentActive.focus();
                document.body.removeChild(inputDom);
            });
        }
    }

    function handleClick() {
        const theDom = document.querySelector('.gcsj-func-normal-text');
        copyText(theDom.innerText);
    }
    window.addEventListener('click', handleClick);

    async function handleKeyUp(event) {
        if (event.keyCode === 39) {
            const theDom = document.querySelector('.gcsj-func-normal-text');
            const oldText = await navigator.clipboard.readText();
            const newText = oldText + '\r\n' + theDom.innerText;
            copyText(newText);
        }
    }
    window.addEventListener('keyup', handleKeyUp);
})();
