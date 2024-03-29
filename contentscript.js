//Copyright (C) 2012 Robert Walls and Shane Clark
//
//This program is free software: you can redistribute it and/or modify
//it under the terms of the GNU General Public License as published by
//the Free Software Foundation, either version 3 of the License, or
//any later version.
//
//This program is distributed in the hope that it will be useful,
//but WITHOUT ANY WARRANTY; without even the implied warranty of
//MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//GNU General Public License for more details.
//
//You should have received a copy of the GNU General Public License
//along with this program.  If not, see <http://www.gnu.org/licenses/>.

function cookieUpdate(name, value, remove){
    //Update the cookieDiv with the appropriate cookie string.
    var cString = _cookieDiv.innerText;
    var cStringNew = "";
    var cookieFound = false;
    var cookiesRaw = cString.split(";");
    
    if(DEBUG) {
	//console.log(name + " isRemoved? " + remove);
    }
    
    for( var i in cookiesRaw ) {
        //remove the whitespace
        cookie = cookiesRaw[i].replace(/^\s+|\s+$/g,"");
        
        //Check if the cookie matches the key we are looking for
        if( cookie.substring(0, name.length) == name) {
            cookieFound = true;
            
            //If we want to remove the cookie, we just skip adding the cookie to the new string
            if(remove) 
                //console.log("removing cookie from string");
                continue;
                
            //replace the cookie with the new value
            cookie = name + "=" + value;
        }
        
         //Add a semicolon, if needed, to separate the cookies we have already processed.
        if( cStringNew.length > 0 )
            cStringNew += "; "; 
    
        //Add the cookie to the new cookie string
        cStringNew += cookie;
        
    }
    
    //if we never found the cookie name, i.e. its a new cookie, we need to add it.
    if( !cookieFound && !remove){
        if( cStringNew.length > 0 )
            cStringNew += "; "; 
    
        //Add the cookie to the new cookie string
        cStringNew += name + "=" + value;
    }
        
    _cookieDiv.innerText = cStringNew;
}

//Checks to see if the domain given by the cookie matches what we see in document.domain
function domainMatch(domain){
    var docDomain = document.domain;
    
    if( docDomain.indexOf('.') != 0 )
        docDomain = '.' + docDomain;
        
    if(domain.toLowerCase() == docDomain.toLowerCase())
        return true;
    
    var index = docDomain.indexOf(domain);
    
    if( index == (docDomain.length - domain.length) )
        return true;
    
    return false;
}


//This code is injected into each page. It overwrites the document.cookie so we can catch and rewrite any cookie set from the page itself.
//The cookieDiv is used to store the document.cookie getter string.
//The messageDiv is used to store raw cookies that the page is trying to set.
var actualCode = 
    'var _cookieDiv = document.createElement("div");' +
    '_cookieDiv.setAttribute("id","cookieDiv");' +
    'document.documentElement.appendChild(_cookieDiv);' +
    '_cookieDiv.style.display = "none";' +
    'var _messageDiv = document.createElement("div");' +
    '_messageDiv.setAttribute("id","messageDiv");' +
    'document.documentElement.appendChild(_messageDiv);' +
    '_messageDiv.style.display = "none";' +  
    'var _messageEvent = document.createEvent("Event");' +
    '_messageEvent.initEvent("messageEvent", true, true);' +
    '_messageDiv.innerText = "Nom Nom Nom";' +
    'var _cookie = document.cookie;' + 
    'console.log(document.cookie);' + 
    'document.__defineSetter__("cookie", function(the_cookie) {_cookie = the_cookie; _messageDiv.innerText = the_cookie; _messageDiv.dispatchEvent(_messageEvent); } );' +
    'document.__defineGetter__("cookie", function() {return _cookieDiv.innerText;} ); ';

var script = document.createElement('script');
script.appendChild(document.createTextNode(actualCode));
(document.head || document.documentElement).appendChild(script);
script.parentNode.removeChild(script);

//Retrieve the messageDiv we just injected into the page. This div is as temp storage for write calls to document.cookie
var _messageDiv = document.getElementById("messageDiv");

//This div (injected by our extension) holds the current cookie string.
var _cookieDiv = document.getElementById("cookieDiv");

var DEBUG = new Boolean(0);

//We need to prepopulate the cookie div when the page loads. Our background script will look through the cookies and return the appropriate ones using the callback.
chrome.extension.sendRequest({type : 'cookieBootstrap', url : document.URL}, 
    function(cString) {        
        _cookieDiv.innerText = cString;
    });
    
//Listen for any update messages from the background script. These message will be sent if any cookie in the store is updated and the tab's domain matches. Could occur if cookies are updated via HTTP headers.
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse){            
        if(domainMatch(request.domain)){            
            cookieUpdate(request.cookieName, request.cookieValue, request.isRemoved);
        }
    
    }
);

//Fires when the document.cookie setter is called. Tells the background script to set a new cookie.
document.addEventListener('messageEvent', 
    function() {
        //immediately add this cookie to the cookie div
        rawCookieUpdate(_messageDiv.innerText);
        
        chrome.extension.sendRequest(
            {type:'setCookie', url : document.URL, cookieRaw:_messageDiv.innerText});
    
    });
    
//Add a raw cookie to the cookie div. We need to call this function when the document.cookie setter is called so that cookie is available to page sooner. Otherwise we would have to wait for a bunch of update messages.
function rawCookieUpdate(cStringRaw){
        var cookieParts = cStringRaw.split(";");

        //remove the whitespace
        var cString = cookieParts[0].replace(/^\s+|\s+$/g,"");
    
        var splitIndex = cString.indexOf("=");
        
        var namePart = cString.substring(0, splitIndex);
        var valuePart = cString.substring(splitIndex+1, cString.length);
        
        _cookieDiv.innerText += "; " + namePart + "=" + valuePart;
        
}


