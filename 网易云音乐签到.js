// ==UserScript==
// @name         网易云音乐签到
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       fgfg163
// @run-at       document-end
// @match        https://music.163.com/
// @icon         https://music.163.com/favicon.ico
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

const onLoadPromise = (target) => {
    return new Promise((resolve ,reject) => {
        target.addEventListener('load', resolve);
        target.addEventListener('error', reject);
    });
}

(async function() {
    'use strict';
    const iframe = await onDomFound(document.body, 'iframe', 10000);
    await onLoadPromise(iframe);
    const btn = await onDomFound(iframe.contentDocument.documentElement, 'a.sign', 10000);
    btn.click();
})();
