function detectLogin() {
// Get all elements with <input> tags (forms)
    var els = document.getElementsByTagName('input');
// Find a password field.
    for(var x = 0; x < els.length; x++) { 
	if(els[x].type.toLowerCase() == 'password' ) { 
	    // Notify background.js
	    chrome.extension.sendRequest({page: 'login page', domain: document.domain.replace('www.','')});
	}
    }
}

function cookieUpdate(name, value, remove){
    //Update the cookieDiv with the appropriate cookie string.
    var cString = _cookieDiv.innerText;
    var cStringNew = "";
    var cookieFound = false;
    var cookiesRaw = cString.split(";");
    
    for( var i in cookiesRaw ) {
        //remove the whitespace
        cookie = cookiesRaw[i].replace(/^\s+|\s+$/g,"");
        
        //Check if the cookie matches the key we are looking for
        if( cookie.substring(0, name.length) == name) {
            cookieFound = true;
            
            //If we want to remove the cookie, we just skip adding the cookie to the new string
            if(remove)
                console.log("removing cookie from string");
                continue;
                
            //replace the cookie with the new value
            cookie = name + ";" + value;
        }
        
         //Add a semicolon, if needed, to separate the cookies we have already processed.
        if( cStringNew.length > 0 )
            cStringNew += "; "; 
    
        //Add the cookie to the new cookie string
        cStringNew += cookie;
        
    }
    
    //if we never found the cookie name, i.e. its a new cookie, we need to add it.
    if( !cookieFound ){
        if( cStringNew.length > 0 )
            cStringNew += "; "; 
    
        //Add the cookie to the new cookie string
        cStringNew += name + ";" + value;
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

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse){
        console.log("Cookie update message received by content script! " + request.cookieName);
        console.log(request.domain);
        console.log(document.domain);
        
        if(domainMatch(request.domain)){
            console.log("Cookie update for correct domain.");
            console.log(request);
            cookieUpdate(request.cookieName, request.cookieValue, request.isRemoved);
        }
    
    }
);



var actualCode = 
    'var _cookieDiv = document.createElement("div");' +
    '_cookieDiv.setAttribute("id","cookieDiv");' +
    'document.documentElement.appendChild(_cookieDiv);' +
    //'_cookieDiv.style.display = "none";' +
    'var _messageDiv = document.createElement("div");' +
    '_messageDiv.setAttribute("id","messageDiv");' +
    'document.documentElement.appendChild(_messageDiv);' +
    //'_messageDiv.style.display = "none";' +  
    'var _messageEvent = document.createEvent("Event");' +
    '_messageEvent.initEvent("messageEvent", true, true);' +
    '_messageDiv.innerText = "Nom Nom Nom";' +
    'var _cookie = document.cookie;' + 
    'console.log(document.cookie);' + 
    'document.__defineSetter__("cookie", function(the_cookie) {_cookie = the_cookie; console.log("Our cookie setter was called! " + the_cookie); _messageDiv.innerText = the_cookie; _messageDiv.dispatchEvent(_messageEvent);} );' +
    'document.__defineGetter__("cookie", function() {console.log("Our getter was called: " + _cookieDiv.innerText); return _cookieDiv.innerText;} );';

var script = document.createElement('script');
script.appendChild(document.createTextNode(actualCode));
(document.head || document.documentElement).appendChild(script);
script.parentNode.removeChild(script);
var _messageDiv = document.getElementById("messageDiv");


var _cookieDiv = document.getElementById("cookieDiv");

//We need to prepopulate the cookie div when the page loads.

chrome.extension.sendRequest({type : 'cookieBootstrap', url : document.URL}, 
    function(cString) {
        console.log("Bootstrapping cookie div to :" + cString);
        _cookieDiv.innerText = cString;
    });
    
document.addEventListener('messageEvent', 
    function() { 
        console.log("Sending cookie info to background: " + _messageDiv.innerText); 
        chrome.extension.sendRequest({type:'setCookie', url : document.URL, cookieRaw:_messageDiv.innerText});
    
    });


