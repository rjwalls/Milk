// Copyright (c) 2012 

console.log(chrome.webRequest)

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
