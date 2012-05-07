// Copyright (c) 2012 

// Logging switch
var DEBUG = new Boolean(1);
// Global storage for tabId->domain mappings.
//var kv_arr=new Array();
var kv_arr = {};
var root_store = new Array();

if(DEBUG) {
    //console.log(chrome.webRequest)
}

//Logs anytime a cookie is changed.
chrome.cookies.onChanged.addListener( 
    function(info) {
	if(DEBUG) {
            //console.log("onChanged" + JSON.stringify(info));
	}
        
        //Whenever a cookie is updated, we need to send the updated cookie to every tab that should be able to read it via javascript (and the cookie has httpOnly set to false)
        
        //Only update the tabs if the cookie is not http only
        if( info.cookie.httpOnly) 
            return;
        
        var matches = info.cookie.name.match('[.A-Za-z0-9]+!!!');
        
        //if it has no key then do nothing.
        if( !matches )
            return;
            
        //assume the key is the first match
        var key = matches[0];

        //remove key from name
        var name = info.cookie.name.substring(key.length, info.cookie.name.length);
        
        //Get the list of tabs associated with that key
        tabIds = getTabs(key);
        
        //for every tab associated with that key, send the update
        for( var i in tabIds ){
            var request = {cookieName: name, cookieValue: info.cookie.value, isRemoved : info.removed, domain : info.cookie.domain };
            
            
            if( tabIds[i] >= 0){
                //console.log("Sending update message to tab " + tabIds[i]);
                //console.log("Key is: " + key);
                //console.log("Name is: " + name);
                chrome.tabs.sendRequest(parseInt(tabIds[i]), request);
            }
        }


        
        
    });

// Logs all response headers containing Set-Cookie 
chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        for(var i in details.responseHeaders) {
            //check if this response header is for setting cookies.
            if(details.responseHeaders[i].name.toLowerCase() == 'set-cookie') {
		if(DEBUG) {
                    //console.log('Logging cookie header before modification.');
                    //console.log(details.responseHeaders[i].value);
		}
                //This is the key we need to append to the front of the cookie's name so that we can bind the cookie to a particular domain.
                var cKey = getCookieKey(details.tabId, details.url);
                
                //Just append the key to the front of the header value. This works because the cookie's name is the first entry in the value string.
                details.responseHeaders[i].value = cKey + details.responseHeaders[i].value;
                if(DEBUG) {
                    //console.log('Logging the cookie header after modification.');
                    //console.log(details.responseHeaders[i].value);
		}
            }
        }
        
        return  { responseHeaders:details.responseHeaders };
    },
    {urls: ["<all_urls>"]},
    ["blocking", "responseHeaders"]);

// Logs all response headers containing Set-Cookie. This function will record any header modifications we make in our onHeadersReceived listener.
chrome.webRequest.onCompleted.addListener(
    function(details) {
        for(var i in details.responseHeaders) {
            if(details.responseHeaders[i].name.toLowerCase() == 'set-cookie') {
            
		if(DEBUG) {
                    //If we made any changes to the header, they should show up here.
                    //console.log('Logging the cookie headers upon completion of webrequest');
                    //console.log(details.responseHeaders[i]);
		}
            }
        }
    },
    {urls: ["<all_urls>"]},
    ["responseHeaders"]);

// Logs all request headers containing Cookies. This function will record any header modification we make in our "onBeforeSendHeaders" listener.
chrome.webRequest.onSendHeaders.addListener(
    function(details) {
        for(var i in details.requestHeaders) {
            if(details.requestHeaders[i].name.toLowerCase() == 'cookie') {
		if(DEBUG) {
                    //console.log('Logging the cookie headers upon sending.')
                    //console.log(details.requestHeaders[i]);
		}
            }
        }
    },
    {urls: ["<all_urls>"]},
    ["requestHeaders"]);

function splitCookieString(cookie) {
    var index = cookie.indexOf('=');
    
    var name = cookie.substring(0, index);
    //Add the +1 to skip the '='
    var value = cookie.substring(index+1, cookie.length);
    
    return {'name':name, 'value':value};
}


var requestOrdinal = 0;

// Modifies the headers to only include the cookies we want
chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
        var cKey = getCookieKey(details.tabId, details.url);
        var cString = "";
        var cDict = {};
        
        // Find all of the cookies
        for(var i in details.requestHeaders) {
            if(details.requestHeaders[i].name.toLowerCase() === 'cookie') {
                //Cookie(s) found, we need to split the string to get all of the cookies. Cookie value strings will look like "key1=value1; key2=value2; ..."
                var cookiesRaw = details.requestHeaders[i].value.split(";");

                
                //remove the old cookie header from the request. We will add a new one later if needed.
                details.requestHeaders.splice(i, 1);
                
                for(var j in cookiesRaw){
                    //remove the whitespace.
                    cookie = cookiesRaw[j].replace(/^\s+|\s+$/g,"");
                    
                    //Check if the cookie's prepended key matches what we expect, i.e. this cookie is bound to this domain.
					var curKey = cookie.substring(0, cKey.length);

                    console.log(root_store);

					// It's also ok if this cookie was set by a root store
					// domain
                    if( curKey == cKey || root_store.indexOf(cKey) != -1 ){
					    if(root_store.indexOf(cKey) != -1) {
						    console.log("Found a cookie that belongs to the root store. key: " + cKey);
						    console.log(root_store);
						}

                        //Add a semicolon, if needed, to separate the cookies we have already processed.
                        if( cString.length > 0 ){
                            cString = cString + "; "; 
                        }
                        
                        //remove the key prefix before sending to the server so the cookie will have a name the server expects.
                        cookie = cookie.substring(cKey.length, cookie.length);
                        
                        var cookieSplit = splitCookieString(cookie);
                        
                        if(!cDict[cookieSplit.name]){
                            cDict[cookieSplit.name] = cookieSplit.value;
                        }
                        
                        //Append the current cookie to the cookie header string.
                        cString = cString + cookie;
                    }
                    //Check if the cookie doesn't have a prepended domain key. This could happen if the cookie was set by javascript and therefore not intercepted by this extension. Note: our domain keys follow the format DOMAIN!!!CookieKey
                    else if( cookie.indexOf("!!!") == -1){
                        if( cString.length > 0 ){
                            cString = cString + "; "; 
                        }
			if(DEBUG) {
                            //console.log("Sending unkeyed cookie");
                            //console.log(cookie);
                        }
                        var cookieSplit = splitCookieString(cookie);
                        
			if(DEBUG) {
                            if(cDict[cookieSplit.name]){
				//console.log('Already found another cookie with this name. Overwriting with this cookie.');
                            }
			}
                        
                        cDict[cookieSplit.name] =cookieSplit.value;
                        
                        //We need to update the cookie to add the key!
                        cString = cString + cookie;
                        
                        var cName = cookie.split('=')[0];
                        //append the domain key
                        var keyedName = cKey+cookieSplit.name;
                        
                        //rewrite the cookie in the cookie store to bind it to the current domain.
                        //This  call appears to be causing a race condition. Commenting it out for testing.
                        rewriteCookie(cookieSplit.name,keyedName,details.url, requestOrdinal++);
                    }
                }
                

            }
        }
        
        cString = '';
        
        for(var i in cDict){
            if( cString.length > 0 ){
                cString = cString + "; "; 
            }
            
            cString = cString + i + '='+ cDict[i];
        }
        
        //If we found any cookies with the appropriate domain key, then we add the new header to the request.
        if( cString.length > 0 ) {
            var cookieHeader = {name:"Cookie", value:cString};
            details.requestHeaders.push(cookieHeader);
            if(DEBUG) {
                //console.log('New cookie Header:');
                //console.log(cookieHeader);
	        }
        }
        
        return  { requestHeaders:details.requestHeaders };
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);

// This function gets the cookie key for the current tab. This key is used to store and retrieve keys associated with a particular first party site.
function getCookieKey(tabId, url){
    
    //We have to check for this because the webrequest listener fires before the tabs listener and thus this will be undefined for the first webrequest from a given tab.
    if(kv_arr[tabId] == undefined || kv_arr[tabId] == "newtab"){
	if(DEBUG) {
            //console.log(kv_arr[tabId]);
            //console.log(url);
	}
        domain = getDomain(url);
        kv_arr[tabId]=domain; 
    }
    //console.log(kv_arr[tabId]);
    
    //Our key format is 'DOMAIN!!!' where DOMAIN is the site that we bind the cookie to.
    return  kv_arr[tabId] + "!!!";
}

// This function gets all tab ids associate with a given key
function getTabs(key){
    var tabs = [];
    
    var isRoot = (root_store.indexOf(key) == -1);
    
    for(var id in kv_arr){
        //TODO: If key is in root store, send to all tabs.
        if( isRoot || ((kv_arr[id] + "!!!") == key) )
            tabs.push(id);

    }
    
    return tabs;
}


var updateLog = {};

function mostRecentUpdate(keyed_name, url, ordinal){
    if(DEBUG) {
	//console.log("Current request ordinal: " + ordinal);
    }
    
    domain = getDomain(url);
    if(DEBUG) {
	//console.log("For " + domain + " " + keyed_name);
    }
    if(!updateLog[domain]){
	if(DEBUG) {
            //console.log("Adding domain: " + domain + " to the update log.");
	}
        updateLog[domain] = {};
    }
    
    if(!updateLog[domain][keyed_name]){
	if(DEBUG) {
            //console.log("Adding cookie key: " + keyed_name + " to the updateLog[" + domain + "].");
	}
        updateLog[domain][keyed_name] = -1;
    }
    
    if(updateLog[domain][keyed_name] < ordinal){
        updateLog[domain][keyed_name] = ordinal;
	if(DEBUG) {
            //console.log("Most recent update.");
	}
        return true;
    }
    else{
	if(DEBUG) {
            //console.log("Old update");
	}
        return false;
    }
}

// Replace unkeyed cookies with a keyed version.
function rewriteCookie(name, keyed_name, url, ordinal) {
    //make sure this is the most recent update
    if( !mostRecentUpdate(keyed_name, url, ordinal) ){
        return;
    }
    
    // Get the unkeyed cookie
    chrome.cookies.get({"url": url, "name": name}, function(details) {
	
	if(details == null) {
	    //console.log('No cookies found with details: ');
	    //console.log(name +  ' ' + keyed_name + ' ' + url);
	    return;
	}
	if(DEBUG) {
	    //console.log("Changing cookie " + name + " to " + keyed_name + " for url: " + url);
	}
	// Delete the existing cookie from the CookieStore
	chrome.cookies.remove({"url": url, "name": name});
	// Add the new, keyed version to the CookieStore
	chrome.cookies.set({"url": url, "name": keyed_name, "value": details.value, "domain": details.domain, "path": details.path, "secure": details.secure, "httpOnly": details.httpOnly, "expirationDate": details.expirationDate});
	if(DEBUG) {
	    //console.log(details);
	}
    }
)
}

function getCookieStringFromStore(url, tabId, sendResponse) {
    //get all cookies for a given domain for a given key
    var cKey = getCookieKey(tabId, url);
    var cString = "";
    
    chrome.cookies.getAll({"url": url}, function(cookies) {

        //Check to see if we have any cookies to deal with. If not just return
        if(cookies == null || cookies.length == 0) {
            //console.log('No cookies found with details: ' + url);
            return;
        }
        
        console.log("Getting cookies for " + cKey);
        console.log("domain" + getDomain(url));
        
        for( var i in cookies ){
            //check if cookie is in the root store
            var isRoot = root_store.indexOf(getDomain(url)) != -1;
            
            //Check if the cookie's prepended key matches what we expect,
            var isKeyMatch = cookies[i].name.substring(0, cKey.length) == cKey;
        
            var isHttpOnly = cookies[i].httpOnly;
            
            console.log("isRoot " + isRoot);
            console.log("isKeyMatch " + isKeyMatch);
            console.log("isHttpOnly " + isHttpOnly);
            
            if( isRoot || (isKeyMatch && !isHttpOnly)){
                console.log("Adding cookie to string");
            
                
                //If the domain is in the root store, then the key we remove will be different than cKey, so we cant just use the length.
                var matches = cookies[i].name.match('[.A-Za-z0-9]+!!!');
        
            
                //assume the key is the first match
                var key = matches[0];
                
                //remove the key prefix
                name = cookies[i].name.substring(key.length, cookies[i].name.length);
        
                //Add a semicolon, if needed, to separate the cookies we have already processed.
                if( cString.length > 0 )
                    cString += "; "; 
                
                cString += (name +  "=" + cookies[i].value);
            }
            
                
            if(isRoot){
                    console.log("Javascript cookie found in root store");
            }
                

        }
        
        console.log(cString);
        
        sendResponse(cString);
        
    });
}

// A listener that fires whenever a tab is updated to check the URL.
chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        // Associate the tabId with the current tab URL to track the current domain that should be able to fetch cookies.
        domain = getDomain(tab.url);
	if(DEBUG) {
            //console.log("Associating Tab " + tabId + ' with ' + domain);
	}
        kv_arr[tabId]=domain;
    }
);

chrome.tabs.onRemoved.addListener(
    function(tabId, removeInfo) {
        //Remove the tab Id and it's domain association from the domain store
        delete kv_arr[tabId];
    
    }

);
// Listen for messages from the content scripts.
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if (request.type == "cookieBootstrap") {  
	    if(DEBUG) {
		//console.log("Bootstrapping the cookies for the page load.");
	    }
            getCookieStringFromStore(request.url, sender.tab.id, sendResponse);
        }
        else if(request.type == "setCookie") {
	    if(DEBUG) {
		//console.log("Setting cookie received from javascript: " + request.cookieRaw);
	    }
            parseAndStoreRawCookie(sender.tab.id, request.url, request.cookieRaw);
            sendResponse("blah");
        }
			else if(request.type == "login") {
				//// Add the domain to the root store if it is not already there.
				if(root_store.indexOf(getDomain(request.domain)) == -1) {
				    root_store.push(getDomain(request.domain)); 
				} 
				console.log("Root store contains " + root_store); 
			}
		}
);


function parseAndStoreRawCookie(tabId, url, cookieRaw){
    if(DEBUG) {
	//console.log("Attempting to parse raw cookie string: " + cookieRaw);
    }
    var cookieObj = {};
    cookieObj.url = url;
    
    var cKey = getCookieKey(tabId, url);
    
    var cookieParts = cookieRaw.split(';');

    if(DEBUG) {
	//console.log(cookieParts);
    }

    for( var i=0; i<cookieParts.length; i++){
        if(cookieParts[i].length == 0)
            continue;
    
        //remove the whitespace
        var cString = cookieParts[i].replace(/^\s+|\s+$/g,"");
    
        var splitIndex = cString.indexOf("=");
        
        var namePart = cString.substring(0, splitIndex);
        var valuePart = cString.substring(splitIndex+1, cString.length);
        
        
        //first part is the name value pair
        if( i == 0 ){
            cookieObj.name = cKey + namePart;
            cookieObj.value = valuePart;
        }
        else if( namePart.toLowerCase() == "path" ){
            cookieObj.path = valuePart;
        }
        else if( namePart.toLowerCase() == "domain" ){
            cookieObj.domain = valuePart;
        }
        //else if( partSplit[0].toLowerCase() == "max-age" ){
            //not sure what to do here....
        //}
        else if( namePart.toLowerCase() == "expires" ){
            //convert the gmt string to seconds since the unix epoch
            var date = new Date(valuePart);
            cookieObj.expirationDate = date.getTime() / 1000;
        }
        else if( namePart.toLowerCase() == "secure" ){
            cookieObj.secure = true;
        }
        else{
            //console.log("Unknown part!!!! " + partSplit); 
        }
    }
    if(DEBUG) {
	//console.log(cookieObj);
    }
    chrome.cookies.set(cookieObj);
}



function getDomain(url) {
    //TODO: Not sure what happens when you specify an IP address.
    pathArray = url.split('/');
    if(pathArray.length < 2){
	if(DEBUG) {
            //console.log('Failed to parse url string: ' + url);
	}
        return url;
    }
    
    pathArray = pathArray[2].split('.');

    //works three letter domain names, e.g. those used for US sites like Google.com and UMass.edu
    if(pathArray[pathArray.length-1].length == 3) {
        return pathArray[pathArray.length-2]+'.'+pathArray[pathArray.length-1]
    } 
    //works for co.uk and similar domain names.
    else if(pathArray[pathArray.length-1].length == 2) {
        return pathArray[pathArray.length-3]+'.'+pathArray[pathArray.length-2]+'.'+pathArray[pathArray.length-1];
    }
    if(DEBUG) {
	//console.log('Failed to parse url string: ' + url);
    }
    return url;
}
