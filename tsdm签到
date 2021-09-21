// ==UserScript==
// @name         tsdm签到
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       fgfg163
// @run-at       document-end
// @match        https://www.tsdm39.net/forum.php
// @icon         https://www.tsdm39.net/favicon.ico
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

    await onDomFound(document.body, '#um', 10000);
    const btn = await onDomFound(
        document.body,
        () => Array.from(document.querySelectorAll('#um a')).find((dom) => {
            return dom.innerText?.includes('签到领奖')
        }),
        10000
    );
    btn.click();
    const btn2 = await onDomFound(document.body, 'ul.qdsmilea li', 10000);
    btn2.click();
    const input1 = await onDomFound(document.body, '#todaysay', 10000)
    input1.value = '今天很高兴啊~~';
    input1.dispatchEvent(new Event('input', { bubbles: true }));
    const btn3 = await onDomFound(
        document.body,
        () => Array.from(document.querySelectorAll('form#qiandao button')).find(dom => dom.innerText.includes('点我签到')),
        10000
    );
    btn3.click();
})();
