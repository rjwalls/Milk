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
                console.log(details.responseHeaders[i].value);
            
                var cKey = getCookieKey();
                
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
        var cKey = getCookieKey();
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
function getCookieKey(){
    //TODO: Implement this.
    
    return "fluffyKittenKey!!!";
}

