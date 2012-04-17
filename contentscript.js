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

var actualCode = 'var _cookie = document.cookie; document.__defineSetter__("cookie", function(the_cookie) {_cookie = the_cookie;} ); document.__defineGetter__("cookie", function() {alert(_cookie);} );'

var script = document.createElement('script');
script.appendChild(document.createTextNode(actualCode));
(document.head || document.documentElement).appendChild(script);
script.parentNode.removeChild(script);

detectLogin();