function getDomain() {
    chrome.extension.sendRequest(document.domain);
}

function detectLogin() {
// Get all elements with <input> tags (forms)
    var els = document.getElementsByTagName('input');
// Find a password field.
    for(var x = 0; x < els.length; x++) { 
	if(els[x].type.toLowerCase() == 'password' ) { 
	    // Notify background.js
	    chrome.extension.sendRequest({page: 'login page'});
	}
    }
}

detectLogin();