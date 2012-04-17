function getDomain() {
    chrome.extension.sendRequest({domain: document.domain});
}

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



var actualCode = 
    'var _newDiv = document.createElement("div");' +
    '_newDiv.setAttribute("id","cookieDiv");' +
    'document.documentElement.appendChild(_newDiv);' +
    'var customEvent = document.createEvent("Event");' +
    'customEvent.initEvent("myCustomEvent", true, true);' +
    '_newDiv.innerText = "Nom Nom Nom";' +
    'var _cookie = document.cookie;' + 
    'console.log(document.cookie);' + 
    'document.__defineSetter__("cookie", function(the_cookie) {_cookie = the_cookie; console.log("Our cookie setter was called! " + the_cookie); _newDiv.innerText = the_cookie; _newDiv.dispatchEvent(customEvent);} ); document.__defineGetter__("cookie", function() {console.log("Our getter was called"); _newDiv.dispatchEvent(customEvent);} );'

var script = document.createElement('script');
script.appendChild(document.createTextNode(actualCode));
(document.head || document.documentElement).appendChild(script);
script.parentNode.removeChild(script);

console.log(document.cookie);

detectLogin();

document.getElementById("cookieDiv").addEventListener('myCustomEvent', function() { console.log("Event Fired! " + document.getElementById("cookieDiv").innerText); });


