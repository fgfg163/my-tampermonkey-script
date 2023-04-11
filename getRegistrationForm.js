// ==UserScript==
// @name         拉取报名表
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  拉取报名表
// @author       fgfg163
// @match        https://ggfw.hrss.gd.gov.cn/sydwbk/center.do*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gd.gov.cn
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';
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

    const sleepPromise = ms => new Promise(r => setTimeout(r, ms));

    const fetchData = function () {

        let lastFetchTime = Date.now() - 10000;

        return async function (uri, formData) {
            const theNow = Date.now();
            const diff = theNow - lastFetchTime;
            if (diff > 3000) {
                lastFetchTime = theNow;
            } else {
                lastFetchTime = lastFetchTime + 3000;
                await sleepPromise(lastFetchTime - Date.now());
            }

            return await (await fetch(uri, {
                method: 'POST',
                credentials : 'include',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                body: new URLSearchParams(formData).toString()
            })).json();
        }
    }();



    import('https://cdn.jsdelivr.net/npm/excellentexport@3.9.3/dist/excellentexport.min.js');
    import('https://cdn.jsdelivr.net/npm/dayjs@1.11.7/dayjs.min.js');


    const getDate = function () {
        let cache = {};
        return function(timestamp) {
            if (!cache[timestamp]) {
                cache[timestamp] = window.dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
            }
            return cache[timestamp];
        };
    }();


    const popup = await onDomFound(document, () => {
        return Array.from(document.querySelectorAll('.ui-popup.ui-popup-modal')).find(i => i.innerText.indexOf('请完善个人信息') > -1);
    }, 5000).catch((...err) => console.error(...err));

    const toDetailsPageBtn = await onDomFound(document, 'ul#navi-list #Item_toDetailsPage', 10000);
    const toDetailsPageA = toDetailsPageBtn.parentNode;
    const df = document.createElement('div');
    df.innerHTML = toDetailsPageA.outerHTML;
    const downloadBtn = df.children[0];
    const downloadBtnLi = downloadBtn.querySelector('li');
    downloadBtnLi.innerText = '下载岗位报名统计';
    downloadBtnLi.id = 'Item_downloadDetails';
    (await onDomFound(document, 'ul#navi-list', 1000)).appendChild(downloadBtn);

    async function downloadDetails() {
        const provinceList = (await fetchData('https://ggfw.hrss.gd.gov.cn/sydwbk/exam/details/area.do', {
            baz051: 441067,
            page: 1,
            rows: 40,
        })).rows || [];

        console.log(provinceList);

        await Promise.allSettled(provinceList.map(async row => {
            row.data = [];
            const res = await fetchData('https://ggfw.hrss.gd.gov.cn/sydwbk/exam/details/spQuery.do', {
                ...row.id,
                page: 1,
                rows: 1000,
            });
            row.data = res.rows;
            console.log(row);
            return res;
        }));


        await import('https://cdn.jsdelivr.net/npm/excellentexport@3.9.3/dist/excellentexport.min.js');
        await import('https://cdn.jsdelivr.net/npm/dayjs@1.11.7/dayjs.min.js');

        let lasttime = 0;



        // 特别关注
        const favoidlist = [
            '2311266990618',
            '2311266990486',
            '2311266990053',
            '2311266990528',
            '2311266990159',
            '2311266990485',
            '2311266990653',
            '2311266990743',
        ];
        const favoidSet = new Set(favoidlist);
        const favoList = [];


        const sheets = provinceList.map(i => ({
            name: i.baa146,
            from: {
                array: [
                    ['','招聘单位','招聘岗位','岗位代码','聘用人数','报名人数','统计时间'],
                    ...i.data.map((row, index) => {
                        if (favoidSet.has(row.bfe301)) {
                            console.log(row);
                            row.baa146 = i.baa146;
                            favoList.push(row);
                        }
                        lasttime = Math.max(lasttime, row.aae036);
                        return [
                            index + 1,
                            row.aab004,
                            row.bfe3a4,
                            row.bfe301,
                            row.aab019,
                            row.aab119,
                            getDate(row.aae036),
                        ];
                    }),
                ]
            }
        }));
        sheets.unshift({
            name: '特别关注',
            from: {
                array: [
                    ['','市', '招聘单位','招聘岗位','岗位代码','聘用人数','报名人数','统计时间'],
                    ...favoList.map((row, index) => {
                        if (favoidSet.has(row.bfe301)) {
                            favoList.push(row);
                        }
                        return [
                            index + 1,
                            row.baa146,
                            row.aab004,
                            row.bfe3a4,
                            row.bfe301,
                            row.aab019,
                            row.aab119,
                            getDate(row.aae036),
                        ];
                    }),
                ]
            }
        });

        window.ExcellentExport.convert(
            { anchor: null, filename: '广东省事业单位公开招聘信息管理系统（考生报名） '+ getDate(lasttime), format: 'xlsx', openAsDownload: true},
            sheets
        );
    }

    downloadBtn.addEventListener('click', downloadDetails);

})();
