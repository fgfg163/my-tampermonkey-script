// ==UserScript==
// @name         bilibili获取直播房间列表
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  b站直播列表获取房间
// @author       fgfg163
// @require      https://cdn.jsdelivr.net/npm/xe-clipboard@1.10.2/dist/xe-clipboard.umd.min.js
// @match        https://live.bilibili.com/p/eden/area-tags
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @grant        none
// ==/UserScript==


const matchesElement = (element, selector) => {
    let current = element;
    while (current && current.matches) {
        if (current.matches(selector)) {
            return current;
        }
        current = current.parentNode;
    }
    return;
};

const onDomFound = (() => {
    let cbList = [];
    return (baseElement, targetSelector, callback) => {
        if(cbList.indexOf(callback) === -1) {
            const observorConfig = { childList: true, subtree: true };
            const bodyObserver = new MutationObserver((mutationsList) => {
                if (baseElement.querySelector(targetSelector)) {
                    callback();
                    cbList = cbList.filter(c => c !== callback);
                    bodyObserver.disconnect();
                }
            });
            bodyObserver.observe(baseElement, observorConfig);
        }
    };
})();

const sleepPromise = ms => new Promise(r => setTimeout(r, ms));

const addStyle = (innerHTML) => {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = innerHTML;
    document.head.appendChild(style);
};

const loadStyle = (url) => {
    const style = document.createElement('link');
    style.rel='stylesheet';
    style.type = 'text/css';
    style.href = url;
    document.head.appendChild(style);
};

const getRoomIdFromUrl = (url) => {
    const theUrl = new URL(url, window.location.origin);
    const idStr = theUrl.pathname.replace(/^\//, '');
    return !isNaN(parseInt(idStr)) ? parseInt(idStr) : undefined;
};

const JSONparse = (str) => {
    let res;
    try {
        res = JSON.parse(str);
    } catch(err) {
    }
    return res;
};

(async function() {
    'use strict';

    addStyle('.roomid-selected{opacity:0.2};');

    let selectedList = [];
    let filterSingFlag = false;

    const selectedClickHandle = (event) => {
        const item = matchesElement(event.target, '#area-tag-list>div:nth-child(2)>div');
        const anchor =item.querySelector(':scope>a');
        const covor = item.querySelector(':scope>a>div:nth-child(2)>div:nth-child(1)');
        if (item && anchor && covor) {
            event.stopPropagation();
            event.preventDefault();
            const roomid = getRoomIdFromUrl(anchor.getAttribute('href'));
            if (selectedList.indexOf(roomid) > -1) {
                selectedList = selectedList.filter(i => i !== roomid);
                item.className = (item.className || '').replace(/\s*roomid-selected\s*/, ' ');
            } else {
                selectedList = selectedList.concat(roomid);
                item.className = item.className + ' roomid-selected';
            }
            console.log('\n' + selectedList.join(' '));
        }
    };


    const filterSingCard = (flag) => {
        const itemDomList = Array.from(document.querySelectorAll('#area-tag-list>div:nth-child(2)>div'));
        if (flag) {
            itemDomList.forEach((itemDom) => {
                const title = itemDom.querySelector(':scope>a>div:nth-child(2)>div:nth-child(2)>div:nth-child(2)>div:nth-child(1)').innerText;
                if (title.includes('歌')) {
                    itemDom.removeAttribute('data-visible');
                } else {
                    itemDom.setAttribute('data-visible', 'hidden');
                }
            });
        } else {
            itemDomList.forEach((itemDom) => {
                itemDom.removeAttribute('data-visible');
            });
        }
    };

    onDomFound(document.body, '#area-tag-list', () => {
        const listDom = document.querySelector('#area-tag-list>div:nth-child(2)');
        let lastdiffkey = '';

        const observorConfig = { childList: true, subtree: true };
        const observer = new MutationObserver((mutationsList) => {
            for(let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const itemDomList = Array.from(listDom.querySelectorAll(':scope>div'));
                    const roomidlist = itemDomList.map((element) => {
                        return getRoomIdFromUrl(element.querySelector(':scope>a').getAttribute('href'));
                    });
                    const nextdiffkey = roomidlist.join(' ');

                    if (lastdiffkey !== nextdiffkey) {
                        itemDomList.forEach((itemDom) => {
                            // itemDom.removeEventListener('click', selectedClickHandle);
                            itemDom.addEventListener('click', selectedClickHandle);
                        });
                        filterSingFlag && filterSingCard(filterSingFlag);
                    }
                    lastdiffkey = nextdiffkey;
                    break;
                }
            }
        });
        observer.observe(listDom, observorConfig);
    });


    onDomFound(document.body, '.live-sidebar-ctnr', () => {
        const boxDom = document.querySelector('.live-sidebar-ctnr');
        const backgroundColor = window.getComputedStyle(boxDom).backgroundColor;
        const btnList = Array.from(boxDom.querySelectorAll('.sidebar-btn'));
        const btnConcernedDom = btnList.find(dom => dom.querySelector('.concerned'))?.cloneNode(true);
        if (btnConcernedDom) {
            btnConcernedDom.title = '复制选中';
            btnConcernedDom.style.backgroundColor = backgroundColor;
            const label = btnConcernedDom.querySelector('.label-ctnr > span');
            label && (label.innerText = '复制选中');
            btnConcernedDom.addEventListener('click', () => {
                window.XEClipboard.copy(selectedList.join(' '));
            });
            boxDom.querySelector('.group-wrap')?.appendChild(btnConcernedDom);
        }
    });



    addStyle(`
    #area-tag-list > div:nth-child(2) > div[data-visible=hidden]{
    display:none;
    }`);
    onDomFound(document.body, '.live-sidebar-ctnr', () => {
        const boxDom = document.querySelector('.live-sidebar-ctnr');
        const backgroundColor = window.getComputedStyle(boxDom).backgroundColor;
        const btnList = Array.from(boxDom.querySelectorAll('.sidebar-btn'));
        const btnConcernedDom = btnList.find(dom => dom.querySelector('.concerned'))?.cloneNode(true);
        if (btnConcernedDom) {
            btnConcernedDom.title = '过滤"歌"';
            btnConcernedDom.style.backgroundColor = backgroundColor;
            const label = btnConcernedDom.querySelector('.label-ctnr > span');
            label && (label.innerText = '过滤"歌"');
            btnConcernedDom.addEventListener('click', async () => {
                filterSingFlag = !filterSingFlag;
                filterSingCard(filterSingFlag);
                while (document.documentElement.offsetHeight >= document.documentElement.scrollHeight) {
                    const event = document.createEvent('HTMLEvents');
                    event.initEvent( 'scroll', true, true );
                    boxDom.dispatchEvent(event);
                    await sleepPromise(1000);
                }
            });
            boxDom.querySelector('.group-wrap')?.appendChild(btnConcernedDom);
        }
    });

    addStyle(`
    .side-bar-popup-cntr{
    width:50vw !important;
    bottom: 10px !important;
    }
    .section-content-cntr{
    height: 90vh !important;
    }`);

    onDomFound(document.body, '.live-sidebar-ctnr', () => {
        const boxDom = document.querySelector('.live-sidebar-ctnr');
        const backgroundColor = window.getComputedStyle(boxDom).backgroundColor;
        const btnList = Array.from(boxDom.querySelectorAll('.sidebar-btn'));
        const btnConcernedDom = btnList.find(dom => dom.querySelector('.concerned'));

        const scrollHandle = async () => {
            const boxDom = document.querySelector('.section-content-cntr');
            while (boxDom.offsetHeight >= boxDom.scrollHeight) {
                const event = document.createEvent('HTMLEvents');
                event.initEvent( 'scroll', true, true );
                boxDom.dispatchEvent(event);
                await sleepPromise(100);
            }
        };

        btnConcernedDom.addEventListener('click', () => {
            const boxDom = document.querySelector('.section-content-cntr');
            onDomFound(boxDom, '.user-row', scrollHandle);
        });
    });
})();
