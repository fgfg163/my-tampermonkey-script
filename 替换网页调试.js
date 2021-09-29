// ==UserScript==
// @name         替换网页调试
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       fgfg163
// @match        https://www.baidu.com/*
// @match        http://www.test-ipv6.com/
// @connect      baidu.com
// @connect      *
// @connect      www.test-ipv6.com
// @icon         https://www.test-ipv6.com/images/favicon.ico
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// ==/UserScript==

// 为了拦截html加载，这行代码应该尽快执行
window.stop();


(async function() {
    'use strict';
    // 总体代理地址
    // 地址可以写在 localStorage 里
    const proxyHost = localStorage.getItem('proxyHost') || 'https://www.test-ipv6.com/';

    // 临时attribute名称，用于保存数据
    const templateName = 'alsdflnqlhgpoieorho';


    const isHttps = window.location.protocol === 'https:';

    const originInsertBefore = Node.prototype.insertBefore;
    const originAppendChild = Node.prototype.appendChild;

    // 使用 GM_xmlhttpRequest 发起跨域请求，这里把它包装成 promise
    function GM_xmlhttpRequestProxy(url, options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                ...options,
                url,
                onload: function(res, ...args) {
                    res.text = () => res.responseText;
                    options?.onload?.call(this, res, ...args);
                    resolve(res);
                },
                onerror: function(res, ...args) {
                    res.text = () => res.responseText;
                    options?.onerror?.call(this, res, ...args);
                    reject(res);
                }
            });
        });
    }



    function startWith(str, p) {
        return str.slice(0, p.length) === p;
    }
    function endWith(str, p) {
        return str.slice(-p.length) === p;
    }
    function sleepPromise(ms) {
        return new Promise(r => setTimeout(r, ms));
    }


    function copyAllAttr(srcElement, targetElement, withInnerHTML) {
        const attrMap = srcElement.attributes
        const length = srcElement.attributes.length;
        for (let i = 0; i < length; i++) {
            targetElement.setAttribute(attrMap[i].name, attrMap[i].value);
        }
        if (withInnerHTML === undefined || withInnerHTML) {
            targetElement.innerHTML = srcElement.innerHTML;
        }
    }

    function blobToBase64(blob) {
        return new Promise((resolve) => {
            let a = new FileReader();
            a.onload = function (e) {
                resolve(e.target.result);
            }
            a.readAsDataURL(blob);
        });
    }


    // 获取 style/link 的资源，以内联脚本的形式获取
    function getStyle(element, newSrc) {
        let newElement = element;
        let newElementPromise;

        const src = newSrc || element.getAttribute('href');

        if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet' && src) {
            newElement = document.createElement('style');
            newElement.type = 'text/css';
            newElement.rel = 'stylesheet';
            newElement.setAttribute('data-href-' + templateName, src);
            newElementPromise = (async () => {
                const scriptText = await GM_xmlhttpRequestProxy(src).then(res => res.text()).catch(() => undefined);
                if (scriptText) {
                    newElement.innerHTML = scriptText;
                }
                return newElement;
            })();
        }

        return [newElement, newElementPromise];
    }


    // 获取 script 的资源，如果是出现跨域或者https限制，则以内联脚本的形式获取
    function getScript(element, newSrc, newScript) {
        let newElementPromise;
        if (element.tagName === 'SCRIPT') {
            const src = newSrc || element.getAttribute('src');
            const srcLocation = new URL(src, window.location.origin);
            if (src && isHttps && srcLocation.protocol !== 'https:') {
                newElementPromise = (async () => {
                    let newElement = element;
                    if (newScript) {
                        newElement = document.createElement(element.tagName);
                        copyAllAttr(element, newElement);
                    }

                    const scriptText = await GM_xmlhttpRequestProxy(src).then(res => res.text()).catch(() => undefined);
                    if (scriptText) {
                        newElement.innerHTML = scriptText;
                        newElement.removeAttribute('src');
                        newElement.setAttribute('data-src-' + templateName, src);
                    }
                    return newElement;
                })();
            }
        }

        return newElementPromise;
    }


    function getImg(element, newSrc) {
        if (element.tagName === 'IMG') {
            const attrSrc = element.getAttribute('src')
            const src = newSrc || attrSrc;
            const srcUrl = new URL(src, window.location.href);
            if(isHttps && srcUrl.protocol !== 'https:') {
                GM_xmlhttpRequestProxy(src, { responseType: 'blob' })
                    .then(res => blobToBase64(res.response))
                    .then((res) => {
                    if (attrSrc !== src || attrSrc === element.getAttribute('src')) {
                        element.src = res;
                    }
                });
            }
            element.src = newSrc;
        }
    }


    // 网站可能会使用 insertBefore 和 appendChild 插入 script 标签，
    // 拦截，并修改它们的域名
    function processElement(...args) {
        const element = args[0];
        let newArgs = Array.from(args);
        if (element.tagName === 'SCRIPT') {
            if(element.getAttribute('src')){
                const newSrc = new URL(element.getAttribute('src'), proxyHost).href;
                element.src = newSrc;
                const newElementPromise = getScript(element, newSrc);
                if (newElementPromise) {
                    const placeholder = document.createElement('script');
                    placeholder.setAttribute('data-src-' + templateName, newSrc);
                    newArgs[0] = placeholder;

                    element.setAttribute('data-src-' + templateName, newSrc);
                    element.removeAttribute('src');
                    newElementPromise.then((newElement) => {
                        if(placeholder.parentNode) {
                            originAppendChild.call(placeholder.parentNode, newElement, placeholder);
                            placeholder.parentNode.removeChild(placeholder);
                        } else {
                            originAppendChild.call(document.head, newElement);
                        }
                    });
                }
            }
        } else if (element.tagName === 'LINK') {
            if (element.getAttribute('href')) {
                element.href = new URL(element.getAttribute('href'), proxyHost).href;
            }
        }
        return newArgs;
    }
    Node.prototype.insertBefore = function (...args) {
        const args2 = processElement.apply(this, args);
        return originInsertBefore.apply(this, args2);
    }
    Node.prototype.appendChild = function (...args) {
        const args2 = processElement.apply(this, args);
        return originAppendChild.apply(this, args2);
    };


    // 按顺序加载 script 标签
    async function loadScripts(srcElementObjList) {
        for (let [element, newElementPromise] of srcElementObjList) {
            if(element.tagName === 'SCRIPT') {
                let newElement = newElementPromise ? (await newElementPromise) : undefined;
                if(!newElement) {
                    newElement = document.createElement(element.tagName);
                    copyAllAttr(element, newElement);
                }
                if (newElement.tagName === 'SCRIPT' && newElement.getAttribute('src')) {
                    await new Promise((resolve, reject) => {
                        newElement.addEventListener('load', resolve);
                        element.addEventListener('error', resolve);
                        if(element.parentNode){
                            originInsertBefore.call(element.parentNode ,newElement, element);
                            element.parentNode.removeChild(element);
                        } else {
                            originAppendChild.call(document.head, newElement);
                        }
                    });
                } else {
                    if(element.parentNode){
                        originInsertBefore.call(element.parentNode ,newElement, element);
                        element.parentNode.removeChild(element);
                    } else {
                        originAppendChild.call(document.head, newElement);
                    }
                }
            }
        }
    }



    // -------------------
    // 执行功能
    // -------------------
    console.log('js已劫持到' + proxyHost);
    console.log('可以通过 localStorage.setItem("proxyHost", ' + JSON.stringify(proxyHost) + ') 修改代理地址，然后刷新页面生效');

    const theHTML = await GM_xmlhttpRequestProxy(proxyHost).then(res => res.text()).catch(() => undefined);

    const fragment = document.createElement('html');
    fragment.innerHTML = theHTML;



    // 监听 WebSocket 对象，拦截 webpack 热更新的链接
    // WebSocket 对象必须在页面的 script 标签中注入
    // 在此脚本中直接修改 window.WebSocket 会被覆盖回去
    // function W 会转换成字符串注入页面，因此不能随意使用脚本里的变量
    (() => {
        function WS(originWebSocket, proxyHost) {
            return function WebSocket(url, protocols) {
                const theUrl = new URL(url, window.location.href);
                if (theUrl.pathname === '/sockjs-node') {
                    const proxyUrl = new URL(proxyHost, window.location.href);
                    theUrl.host = proxyUrl.host;
                    return new originWebSocket(theUrl.href, protocols);
                }
                return new originWebSocket(url, protocols);
            };
        };
        const s = document.createElement('script');
        s.innerHTML = 'window.WebSocket = (' + WS.toString() + ')(window.WebSocket, ' + JSON.stringify(proxyHost) + ');';
        originAppendChild.call(document.head, s);
        document.head.removeChild(s);
    })();

    // 监听 Worker 对象，
    (() => {
        function W(originWorker, proxyHost) {
            function crosOriginWorker(url, options) {
                const content = 'importScripts(' + JSON.stringify(url) + ');';
                const workerUrlData = URL.createObjectURL(new Blob([ content ], { type: 'text/javascript' }));
                const worker = new originWorker(workerUrlData, options);
                URL.revokeObjectURL(workerUrlData);
                return worker;
            };

            return function Worker(url, options) {
                const theUrl = new URL(url.toString(), proxyHost);
                if (theUrl.origin !== window.location.origin) {
                    return crosOriginWorker(theUrl.href, options);
                }
                return new originWorker(theUrl.href, options);
            };
        };
        const s = document.createElement('script');
        s.innerHTML = 'window.Worker = (' + W.toString() + ')(window.Worker, ' + JSON.stringify(proxyHost) + ');';
        originAppendChild.call(document.head, s);
        document.head.removeChild(s);
    })();

    // 替换掉html中的link
    fragment.querySelectorAll('link[href]').forEach((dom) => {
        const src = dom.getAttribute('href');
        if (src) {
            const newSrc = new URL(src, proxyHost).href;
            dom.setAttribute('href', newSrc);
        }
    });

    fragment.querySelectorAll('img[src],audio[src],video[src]').forEach((dom) => {
        const src = dom.getAttribute('src');
        if (src) {
            const newSrc = new URL(src, proxyHost).href;
            dom.setAttribute('src', newSrc);
        }
    });


    document.documentElement.innerHTML = fragment.innerHTML;


    // 监听元素变化，如果插入图片或者修改图片的url，就劫持url
    (() => {
        function getDomImgData(dom) {
            const attrSrc = dom.getAttribute('src');
            if (!startWith(attrSrc, 'http') && !startWith(attrSrc, 'data:image')) {
                const newStr = new URL(attrSrc, proxyHost).href;
                getImg(dom, newStr);
            }
        }
        const observer = new MutationObserver((mutationsList, observer) => {
            // Use traditional 'for loops' for IE 11
            for(let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((dom) => {
                        if (dom.tagName === 'IMG') {
                            getDomImgData(dom);
                        }
                        const imgList = dom.querySelectorAll && dom.children.length > 0 && dom.querySelectorAll('img');
                        if (imgList && imgList.length > 0) {
                            imgList.forEach((imgDom) => {
                                getDomImgData(imgDom);
                            });
                        }


                        //                         if (dom.tagName === 'LINK') {
                        //                             if (dom.getAttribute('href')) {
                        //                                 const [newElement, newElementPromise] = getStyle(dom);
                        //                                 if(newElement !== dom) {
                        //                                     dom.parentNode && insertAfter.call(dom.parentNode, newElement, dom);
                        //                                 }
                        //                                 newElementPromise.then(() => {
                        //                                     console.log(Array.from(newElement.sheet.rules));
                        //                                     newElement.sheet.rules.forEach((cssstylerule) => {
                        //                                         const bg = cssstylerule.style.getPropertyValue('background');
                        //                                         if (bg) {
                        //                                             cssstylerule.style.setProperty('background', 'red');
                        //                                         }
                        //                                     });
                        //                                 });
                        //                             }
                        //                         }
                        //                         const linkList = dom.querySelectorAll && dom.children.length > 0 && dom.querySelectorAll('link');
                        //                         if (linkList && linkList.length > 0) {
                        //                             linkList.forEach((linkDom) => {
                        //                                 if (dom.getAttribute('href')) {
                        //                                     const [newElement, newElementPromise] = getStyle(dom);
                        //                                     if(newElement !== dom) {
                        //                                         dom.parentNode && insertAfter.call(dom.parentNode, newElement, dom);
                        //                                     }
                        //                                     newElementPromise.then(() => {
                        //                                         newElement.sheet.rules.forEach((cssstylerule) => {
                        //                                             const bg = cssstylerule.style.getPropertyValue('background');
                        //                                             if (bg) {
                        //                                                 cssstylerule.style.setProperty('background', 'red');
                        //                                             }
                        //                                         });
                        //                                     });
                        //                                 }
                        //                             });
                        //                         }
                    });

                    //                     mutation.removedNodes.forEach((dom) => {
                    //                         if (dom.tagName === 'LINK') {
                    //                             const nextDom = dom.nextSibling;
                    //                             if (nextDom && nextDom.tagName === 'STYLE' && nextDom.getAttribute('data-href-' + templateName)) {
                    //                                 nextDom.parentNode?.removeChild(nextDom);
                    //                             }
                    //                         }
                    //                         const linkList = dom.querySelectorAll && dom.children.length > 0 && dom.querySelectorAll('link');
                    //                         if (linkList && linkList.length > 0) {
                    //                             linkList.forEach((linkDom) => {
                    //                                 const nextDom = dom.nextSibling;
                    //                                 if (nextDom && nextDom.tagName === 'STYLE' && nextDom.getAttribute('data-href-' + templateName)) {
                    //                                     nextDom.parentNode?.removeChild(nextDom);
                    //                                 }
                    //                             });
                    //                         }
                    //                     });
                }
                else if (mutation.type === 'attributes') {
                    if (mutation.target.tagName === 'IMG' && mutation.attributeName === 'src') {
                        getDomImgData(mutation.target);
                    }
                }
            }
        });
        observer.observe(document.documentElement, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['src']
        });
    })();


    // 载入外部样式
    document.querySelectorAll('link[rel="stylesheet"][type="text/css"]').forEach(async (oldDom) => {
        const oldSrc = oldDom.getAttribute('href');
        if(oldSrc){
            const newSrc = new URL(oldSrc, proxyHost).href;
            const [newDom] = getStyle(oldDom, newSrc);
            if(newDom !== oldDom && oldDom.parentNode) {
                originAppendChild.call(oldDom.parentNode, newDom, oldDom);
                oldDom.parentNode.removeChild(oldDom);
            } else {
                originAppendChild.call(document.head, newDom);
            }
        }
    });


    // 载入图片
    fragment.querySelectorAll('img').forEach((dom) => {
        const oldSrc = dom.getAttribute('src');
        getImg(oldSrc);
    });



    // 重新载入一遍 html 中的 script 标签
    // 使用 innerHTML 插入 script 并不会执行，必须用 appendChild 插入 新建的 script 标签才会执行
    // 这里重新插入一遍 script 标签让其执行
    const theScriptsObjList = Array.from(document.querySelectorAll('script')).map((oldDom) => {
        const oldSrc = oldDom.getAttribute('src');
        const newSrc = oldSrc ? new URL(oldSrc, proxyHost).href : undefined;
        const newScriptPromise = getScript(oldDom, newSrc, true);
        newSrc && (oldDom.src = newSrc);
        return [oldDom, newScriptPromise];
    });
    // 有的 js 会监听 load 事件，但是上面 window.stop() 时就已经触发过 load 事件了。
    // 当 js 加载完成后手动触发一次 load 事件以便 js 启动
    loadScripts(theScriptsObjList).then(function() {
        if (document.readyState === 'complete') {
            window.dispatchEvent(new Event('load'));
        }
    });
})();
