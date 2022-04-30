// ==UserScript==
// @name         咪咕音乐切换音源
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://music.migu.cn/v3/music/player/audio
// @icon         https://music.migu.cn/favicon.ico
// @grant        none
// ==/UserScript==

const sleepPromise = (ms) => new Promise((r) => setTimeout(r, ms));


const onDomFound = (() => {
    let cbList = [];
    return (baseElement, target, timeoutMs) => {

        const targetDom = (typeof(target) === 'string' && baseElement.querySelector(target))
        || (typeof(target) === 'function' && target());

        if (targetDom) {
            return Promise.resolve(targetDom);
        }

        const indexItem = target;
        const cbItem = cbList.find(item => item[0] === indexItem);
        if(!cbItem) {
            const cbPromise = new Promise((resolve, reject) => {
                const observorConfig = { childList: true, subtree: true };
                const bodyObserver = new MutationObserver((mutationsList) => {
                    const targetDom = (typeof(target) === 'string' && baseElement.querySelector(target))
                    || (typeof(target) === 'function' && target());

                    if (targetDom) {
                        cbList = cbList.filter(item => item[0] !== indexItem);
                        bodyObserver.disconnect();
                        resolve(targetDom);
                    }
                });
                bodyObserver.observe(baseElement, observorConfig);

                if(timeoutMs && timeoutMs > 0) {
                    setTimeout(() => {
                        bodyObserver.disconnect();
                        reject('timeout: ' + timeoutMs + 'ms');
                    }, timeoutMs);
                }
            });
            cbList.push([indexItem, cbPromise]);
            return cbPromise;
        } else {
            return cbItem[1]
        }
    };
})();

(async function() {
    'use strict';
    const btn = await onDomFound(document.body, '.bit-list .bit-item:nth-of-type(1)', 10000);
    btn.click();
})();
