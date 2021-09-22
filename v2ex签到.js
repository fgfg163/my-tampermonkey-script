// ==UserScript==
// @name         v2ex签到
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       fgfg163
// @run-at       document-end
// @match        https://www.v2ex.com/mission/daily
// @icon         https://www.v2ex.com/favicon.ico
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

    await onDomFound(document.body, '#Main', 10000);
    const cell = await onDomFound(
        document.body,
        () => Array.from(document.querySelectorAll('div.cell')).find((dom) => {
            return dom.innerText?.includes('每日登录奖励')
        }),
        10000
    );
    const btn = await onDomFound(
        cell,
        () => Array.from(cell.querySelectorAll('input')).find((dom) => {
            const text = dom.value || '';
            return text.includes('领取') && text.includes('铜币')
        }),
        10000
    );
    btn.click();
})();
