// Copyright (c) 2012 

//Logs anytime a cookie is changed.
chrome.cookies.onChanged.addListener(
    function(info) 
    {
      console.log("onChanged" + JSON.stringify(info));
    }
);

// Hooks all web requests after headers are received and denies those setting
// cookies. 
chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
		for(var i in details.responseHeaders) {
			if(details.responseHeaders[i].name == 'Set-Cookie') {
				console.log("Ate a cookie!");
				return {cancel: true};
			}
		}
  },
  {urls: ["<all_urls>"]},
	["blocking", "responseHeaders"]);
