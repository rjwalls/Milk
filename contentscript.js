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
    
	console.log("Old cookie string " + cString);
	console.log("New cookie string " + cStringNew);

    
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
var _messageDiv = document.getElementById("messageDiv");

var _cookieDiv = document.getElementById("cookieDiv");
var DEBUG = new Boolean(0);

//We need to prepopulate the cookie div when the page loads.
chrome.extension.sendRequest({type : 'cookieBootstrap', url : document.URL}, 
    function(cString) {
        //console.log(document.URL);
        //console.log("Bootstrapping cookie div to :" + cString);
        
        _cookieDiv.innerText = cString;
    });
    
    
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse){
        //console.log("Cookie update message received by content script! " + request.cookieName);
        //console.log(request.domain);
        //console.log(document.domain);
            
        if(domainMatch(request.domain)){
            //console.log("Cookie update for correct domain.");
            
            cookieUpdate(request.cookieName, request.cookieValue, request.isRemoved);
        }
    
    }
);

document.addEventListener('messageEvent', 
    function() { 
        //console.log("Sending cookie info to background: " + _messageDiv.innerText); 
        
        rawCookieUpdate(_messageDiv.innerText);
        
        chrome.extension.sendRequest(
            {type:'setCookie', url : document.URL, cookieRaw:_messageDiv.innerText});
    
    });
    
function rawCookieUpdate(cStringRaw){
        var cookieParts = cStringRaw.split(";");

        //remove the whitespace
        var cString = cookieParts[0].replace(/^\s+|\s+$/g,"");
    
        var splitIndex = cString.indexOf("=");
        
        var namePart = cString.substring(0, splitIndex);
        var valuePart = cString.substring(splitIndex+1, cString.length);
        
        _cookieDiv.innerText += "; " + namePart + "=" + valuePart;
        
}


