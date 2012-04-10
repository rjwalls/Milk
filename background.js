// Copyright (c) 2012 

console.log(chrome.webRequest)
// Globals are cool in JS, right?
var kv_arr=new Array(); 

//Logs anytime a cookie is changed.
chrome.cookies.onChanged.addListener( function(info) {
        console.log("onChanged" + JSON.stringify(info));
    });

// Logs all response headers containing Set-Cookie 
chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
		for(var i in details.responseHeaders) {
			if(details.responseHeaders[i].name == 'Set-Cookie') {
				console.log(details.responseHeaders[i]);
//				return {cancel: true};
			}
		}
    },
    {urls: ["<all_urls>"]},
    ["blocking", "responseHeaders"]);

// Logs all request headers containing Cookies.
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
		for(var i in details.requestHeaders) {
			if(details.requestHeaders[i].name == 'Cookie') {
				console.log(details.requestHeaders[i]);
			}
		}
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);

// A listener that fires whenever a tab is updated to check the URL.
/*chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
// Associate the tabId with the current tab URL to track the current domain that
// should be able to fetch cookies.
	domain = getDomain(tab.url);
	console.log(tabId + ',' + domain);
	kv_arr[tabId]=domain;
    });*/

function load() {
	chrome.windows.getLastFocused(function(focusedWindow) {
		focusedWindowId = focusedWindow.id;
		chrome.tabs.getSelected(focusedWindowId, function(tab) {
			chrome.tabs.update(tab.id, {url: pageToLoad})
		});
	});
}

// Listen for the content script telling the extension that it's at a login page
// or updating the domain for the currently active tab.
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
      if (request.page == "login page") {
	console.log('This is a login page.');
      }
      else if(request.domain) {
	  chrome.windows.getLastFocused(function(focusedWindow) {
		focusedWindowId = focusedWindow.id;
		chrome.tabs.getSelected(focusedWindowId, function(tab) {
		    console.log(tab.id + ',' + request.domain);
		    kv_arr[tab.id]=request.domain;
		});
	});

      }
  }
);

// This actually returns a host right now. For example, mail.google.com instead
// of google.com. May need to address this later.
function getDomain(url) {
    pathArray = url.replace('www.','');
    pathArray = pathArray.split('/');
    return pathArray[2];
}