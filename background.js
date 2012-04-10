// Copyright (c) 2012 


console.log(chrome.webRequest)
// Globals are cool in JS, right?
var kv_arr=new Array(); 

//Logs anytime a cookie is changed.
chrome.cookies.onChanged.addListener( 
    function(info) {
        console.log("onChanged" + JSON.stringify(info));
    });

// Logs all response headers containing Set-Cookie 
chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        for(var i in details.responseHeaders) {
            if(details.responseHeaders[i].name == 'Set-Cookie') {
                console.log(details.responseHeaders[i].value);
            
                var cKey = getCookieKey(details.tabId, details.url);
                
                details.responseHeaders[i].value = cKey + details.responseHeaders[i].value;
                console.log(details.responseHeaders[i].value);
            }
        }
        
        return  { responseHeaders:details.responseHeaders };
    },
    {urls: ["<all_urls>"]},
    ["blocking", "responseHeaders"]);

// Logs all response headers containing Set-Cookie 
chrome.webRequest.onCompleted.addListener(
    function(details) {
        for(var i in details.responseHeaders) {
            if(details.responseHeaders[i].name == 'Set-Cookie') {
                console.log(details.responseHeaders[i]);
//              return {cancel: true};
            }
        }
    },
    {urls: ["<all_urls>"]},
    ["responseHeaders"]);

// Logs all request headers containing Cookies. This function will record any header modification we make in our "onBeforeSendHeaders" listener.
chrome.webRequest.onSendHeaders.addListener(
    function(details) {
        for(var i in details.responseHeaders) {
            if(details.responseHeaders[i].name == 'Set-Cookie') {
                console.log(details.responseHeaders[i]);
                //return {cancel: true};
            }
        }
    },
    {urls: ["<all_urls>"]},
    ["requestHeaders"]);


// Modifies the headers to only include the cookies we want
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        var cKey = getCookieKey(details.tabId, details.url);
        var cString = "";
        
        // Find all of the cookies
        for(var i in details.requestHeaders) {
            if(details.requestHeaders[i].name === 'Cookie') {
                //Cookie(s) found, we need to split the string to get all of the cookies.
                var cookiesRaw = details.requestHeaders[i].value.split(";");
                
                //remove the old cookie header
                details.requestHeaders.splice(i, 1);
                
                for(var j in cookiesRaw){
                    //remove the whitespace.
                    cookie = cookiesRaw[j].replace(/^\s+|\s+$/g,"");
                    
                    if( cookie.substring(0, cKey.length) == cKey){
                        
                        if( cString.length > 0 ){
                            cString = cString + "; "; 
                        }
                        
                        //remove the prefix
                        cookie = cookie.substring(cKey.length, cookie.length);
                        
                        cString = cString + cookie;
                    }
                }
                

            }
        }
        
        if( cString.length > 0 ) {
            var cookieHeader = {name:"Cookie", value:cString};
            details.requestHeaders.push(cookieHeader);
            
            console.log(cookieHeader);
        }
        
        
        return  { requestHeaders:details.requestHeaders };
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);

// This function gets the cookie key for the current tab. This key is used to store and retrieve keys associated with a particular first party site.
function getCookieKey(tabId, url){
    
    //We have to check for this because the webrequest listener fires before the tabs listener and thus this will be undefined for the first webrequest from a given tab.
    if(kv_arr[tabId] == undefined || kv_arr[tabId] == "newtab"){
        console.log(kv_arr[tabId]);
        console.log(url);
        domain = getDomain(url);
        kv_arr[tabId]=domain; 
    }
    //console.log(kv_arr[tabId]);
    
    return  kv_arr[tabId] + "!!!";
}

// A listener that fires whenever a tab is updated to check the URL.
chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
    // Associate the tabId with the current tab URL to track the current domain that
    // should be able to fetch cookies.
    domain = getDomain(tab.url);
    console.log(tabId + ',' + domain);
    kv_arr[tabId]=domain;
    }
);


// Listen for the content script telling the extension that it's at a login page.
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if (request.page == "login page") {  
            console.log(request.domain + ' is a login page.');
        }
    }
);

// This actually returns a host right now. For example, .mail.google.com instead
// of google.com. May need to address this later.
function getDomain(url) {
    pathArray = url.replace('www.','');
    pathArray = pathArray.split('/');
    return pathArray[2];
}