// Copyright (c) 2012 

console.log(chrome.webRequest)
// Global storage for tabId->domain mappings.
var kv_arr=new Array(); 

//Logs anytime a cookie is changed.
chrome.cookies.onChanged.addListener( 
    function(info) {
        console.log("onChanged" + JSON.stringify(info));
        
        //TODO: Whenever a cookie is updated, we need to send the updated cookie to every tab that should be able to read it via javascript (and the cookie has httpOnly set to false)
        
        
        
        //Only update the tabs if the cookie is not http only
        if( info.cookie.httpOnly) 
            return;
    
        //TODO: if the cookie was removed then we need to inform the tabs too!
    
        console.log("Checking updated cookie for key");
    
        var matches = info.cookie.name.match('[.A-Za-z0-9]+!!!');
        
        //if it has no key then do nothing.
        if( !matches )
            return;
            
        //assume the key is the first match
        var key = matches[0];
        console.log("Key is: " + key);
        
        //remove key from name
        var name = info.cookie.name.substring(key.length, info.cookie.name.length);
        
        console.log("Name is: " + name);
        
        //Get the list of tabs associated with that key
        tabIds = getTabs(key);
        
        //for every tab associated with that key, send the update
        for( var i in tabIds ){
            var request = {cookieName: name, cookieValue: info.cookie.value, isRemoved : info.removed, domain : info.cookie.domain };
        
            console.log("Sending update message to tab " + tabIds[i]);
        
            chrome.tabs.sendRequest(parseInt(tabIds[i]), request);
        }


        
        
    });

// Logs all response headers containing Set-Cookie 
chrome.webRequest.onHeadersReceived.addListener(
    function(details) {
        for(var i in details.responseHeaders) {
            //check if this response header is for setting cookies.
            if(details.responseHeaders[i].name.toLowerCase() == 'set-cookie') {
                console.log('Logging cookie header before modification.');
                console.log(details.responseHeaders[i].value);
            
                //This is the key we need to append to the front of the cookie's name so that we can bind the cookie to a particular domain.
                var cKey = getCookieKey(details.tabId, details.url);
                
                //Just append the key to the front of the header value. This works because the cookie's name is the first entry in the value string.
                details.responseHeaders[i].value = cKey + details.responseHeaders[i].value;
                
                console.log('Logging the cookie header after modification.');
                console.log(details.responseHeaders[i].value);
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
            
                //If we made any changes to the header, they should show up here.
                console.log('Logging the cookie headers upon completion of webrequest');
                console.log(details.responseHeaders[i]);
            }
        }
    },
    {urls: ["<all_urls>"]},
    ["responseHeaders"]);

// Logs all request headers containing Cookies. This function will record any header modification we make in our "onBeforeSendHeaders" listener.
chrome.webRequest.onSendHeaders.addListener(
    function(details) {
        for(var i in details.responseHeaders) {
            if(details.responseHeaders[i].name.toLowerCase() == 'cookie') {
                console.log('Logging the cookie headers upon sending.')
                console.log(details.responseHeaders[i]);
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
                    if( cookie.substring(0, cKey.length) == cKey){
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
                    
                        console.log("Sending unkeyed cookie");
                        console.log(cookie);
                        
                        var cookieSplit = splitCookieString(cookie);
                        
                        if(cDict[cookieSplit.name]){
                            console.log('Already found another cookie with this name. Overwriting with this cookie.');
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
            
            console.log('New cookie Header:');
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
    
    //Our key format is 'DOMAIN!!!' where DOMAIN is the site that we bind the cookie to.
    return  kv_arr[tabId] + "!!!";
}

// This function gets all tab ids associate with a given key
function getTabs(key){
    var tabs = [];
    
    for(var id in kv_arr){
        if( (kv_arr[id] + "!!!") == key )
            tabs.push(id);
    }
    
    return tabs;
}


var updateLog = {};

function mostRecentUpdate(keyed_name, url, ordinal){
    console.log("Current request ordinal: " + ordinal);
    
    
    domain = getDomain(url);
    
    console.log("For " + domain + " " + keyed_name);
    
    if(!updateLog[domain]){
        console.log("Adding domain: " + domain + " to the update log.");
        updateLog[domain] = {};
    }
    
    if(!updateLog[domain][keyed_name]){
        console.log("Adding cookie key: " + keyed_name + " to the updateLog[" + domain + "].");
        updateLog[domain][keyed_name] = -1;
    }
    
    if(updateLog[domain][keyed_name] < ordinal){
        updateLog[domain][keyed_name] = ordinal;
        console.log("Most recent update.");
        return true;
    }
    else{
        console.log("Old update");
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
	    console.log('No cookies found with details: ');
	    console.log(name +  ' ' + keyed_name + ' ' + url);
	    return;
	}
	
	console.log("Changing cookie " + name + " to " + keyed_name + " for url: " + url);
	// Delete the existing cookie from the CookieStore
	chrome.cookies.remove({"url": url, "name": name});
	// Add the new, keyed version to the CookieStore
	chrome.cookies.set({"url": url, "name": keyed_name, "value": details.value, "domain": details.domain, "path": details.path, "secure": details.secure, "httpOnly": details.httpOnly, "expirationDate": details.expirationDate});
	
	console.log(details);
    }
)
}

function getCookieStringFromStore(url, tabId, sendResponse) {
    //get all cookies for a given domain for a given key
    var cKey = getCookieKey(tabId, url);
    var cString = "";
    
    chrome.cookies.getAll({"url": url}, function(cookies) {
	
        if(cookies == null || cookies.length == 0) {
            console.log('No cookies found with details: ' + url);
            return;
        }
        
        console.log(cookies);
        
        for( var i in cookies ){
            //Check if the cookie's prepended key matches what we expect, i.e. this cookie is bound to this domain.
            if( cookies[i].name.substring(0, cKey.length) != cKey){
                console.log("Key doesn't match. Skipping.");
                continue;
            }
            
            //if the cookie is httpOnly, we don't want to add it to the cookie string
            if( cookies[i].httpOnly ){
                console.log("Cookie is httpOnly. Skipping.");
                continue;
            }
                
             //remove the key prefix
            name = cookies[i].name.substring(cKey.length, cookies[i].name.length);
        
            //Add a semicolon, if needed, to separate the cookies we have already processed.
            if( cString.length > 0 )
                cString += "; "; 
                
            cString += (name +  "=" + cookies[i].value);
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
        console.log("Associating Tab " + tabId + ' with ' + domain);
        kv_arr[tabId]=domain;
    }
);


// Listen for the content script telling the extension that it's at a login page.
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        console.log("Message from content script!");
    
        if (request.type == "cookieBootstrap") {  
            console.log("Bootstrapping the cookies for the page load.");
            getCookieStringFromStore(request.url, sender.tab.id, sendResponse);
        }
        else if(request.type == "setCookie") {
            console.log("Setting cookie received from javascript: " + request.cookieRaw);
            parseAndStoreRawCookie(sender.tab.id, request.url, request.cookieRaw);
        }
    }
);


function parseAndStoreRawCookie(tabId, url, cookieRaw){
    console.log("Attempting to parse raw cookie string: " + cookieRaw);
    
    var cookieObj = {};
    cookieObj.url = url;
    
    var cKey = getCookieKey(tabId, url);

    
    var cookieParts = cookieRaw.split(';');
    
    console.log(cookieParts);
    
    for( var i=0; i<cookieParts.length; i++){
        if(cookieParts[i].length == 0)
            continue;
    
        partSplit = cookieParts[i].replace(/^\s+|\s+$/g,"").split('=');
        
        //first part is the name value pair
        if( i == 0 ){
            cookieObj.name = cKey + partSplit[0];
            cookieObj.value = partSplit[1];
        }
        else if( partSplit[0].toLowerCase() == "path" ){
            cookieObj.path = partSplit[1];
        }
        else if( partSplit[0].toLowerCase() == "domain" ){
            cookieObj.domain = partSplit[1];
        }
        //else if( partSplit[0].toLowerCase() == "max-age" ){
            //not sure what to do here....
        //}
        else if( partSplit[0].toLowerCase() == "expires" ){
            //convert the gmt string to seconds since the unix epoch
            var date = new Date(partSplit[1]);
            cookieObj.expirationDate = date.getTime() / 1000;
        }
        else if( partSplit[0].toLowerCase() == "secure" ){
            cookieObj.secure = true;
        }
        else{
            console.log("Unknown part!!!! " + partSplit); 
        }
    }
    
    console.log(cookieObj);
    
    chrome.cookies.set(cookieObj);
}


// This actually returns a host right now. For example, .mail.google.com instead
// of google.com. May need to address this later.
function getDomain(url) {
    //TODO: Not sure what happens when you specify an IP address.
    
    //pathArray = url.replace('www','');
    
    //split on the /, take the domain part and split on the '.'
    pathArray = url.split('/');
    
    
    if(pathArray.length < 2){
        console.log('Failed to parse url string: ' + url);
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
    
    console.log('Failed to parse url string: ' + url);
    
    return url;
}