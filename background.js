// Copyright (c) 2012 

console.log(chrome.webRequest)

chrome.webRequest.onBeforeSendHeaders.addListener( 
    function(details) {
        for (var i = 0; i < details.requestHeaders.length; ++i) {
            if (details.requestHeaders[i].name === 'Cookie') {
                console.log(details.requestHeaders[i]);
                //details.requestHeaders.splice(i, 1);
                //console.log(details);
                break;
            }
        }
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);

chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        //console.log(details);
    
        for (var i = 0; i < details.responseHeaders.length; ++i) {
            if (details.responseHeaders[i].name === 'Cookie') {
                //details.responseHeaders.splice(i, 1);
                
                break;
            }
        }
    },
    {urls: ["<all_urls>"]},
    ["blocking", "responseHeaders"]);


//Logs anytime a cookie is changed.
chrome.cookies.onChanged.addListener( function(info) {
        console.log("onChanged" + JSON.stringify(info));
    });

