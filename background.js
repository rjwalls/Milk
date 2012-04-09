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

// Logs all request headers containing Cookies. This function will record any header modification we make in our "onBeforeSendHeaders" listener.
chrome.webRequest.onSendHeaders.addListener(
	function(details) {
		for(var i in details.requestHeaders) {
			if(details.requestHeaders[i].name == 'Cookie') {
				console.log(details.requestHeaders[i]);
			}
		}
	},
	{urls: ["<all_urls>"]},
	["requestHeaders"]);
	
	
// Logs all request headers containing Cookies.
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
    
        //chrome shouldn't be able to find any cookies for this domain, but we should check and make sure
        for(var i in details.requestHeaders) {
            if(details.requestHeaders[i].name === 'Cookie') {
                //Oh noes, cookie found, better remove it.
                console.log(details.requestHeaders[i]);
                details.requestHeaders.splice(i, 1);
            }
        }
        
      
        // We have to make a call to our store and pull all cookies. Then we add those those cookies to the request via headers. Header name should be 'Cookie' and value should be 'key=value'
        var headerString = getCookieString(details.tabId, details.url);
        
        var cookieHeader = {name:"Cookie", value:headerString};
        
        details.requestHeaders.push(cookieHeader);
    
        var responseObj = { requestHeaders:details.requestHeaders };
        
        return responseObj;
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);

// This function gets all cookies associated with a certain tab and domain and returns objects of type {"value", "key"}    
function getCookieString(tabId, url){
    //TODO: Need to implement this.
    
    return "test_key=test_value; test1_key=test1_value";

}

