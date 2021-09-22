// ==UserScript==
// @name         b站签到
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  b站直播列表获取房间
// @author       fgfg163
// @match        https://www.bilibili.com
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// ==/UserScript==

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

const sleepPromise = (ms) => new Promise((r) => setTimeout(r, ms));

(async function() {
    'use strict';

    const avatar = await onDomFound(document.body, 'div:not(.mini-move) > .bili-avatar > .bili-avatar-img', 10000);
    avatar.click();
    sleepPromise(10);
    document.body.click();
})();
