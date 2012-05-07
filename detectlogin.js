function detectLogin() {
	// Get all elements with <input> tags (forms)
  var els = document.getElementsByTagName('input');
	// Find a password field.
  for(var x = 0; x < els.length; x++) { 
		if(els[x].type.toLowerCase() == 'password' ) { 
	    // Notify background.js
			console.log("Sent login notification.");
			var domain_els = document.domain.split('.');
			var cookie_domain = '';
			if(domain_els[domain_els.length-1].length == 3) {
				cookie_domain = domain_els[domain_els.length-2]+'.'+domain_els[domain_els.length-1];
			}
			else {
				cookie_domain = domain_els[domain_els.length-3]+'.'+domain_els[domain_els.length-2]+'.'+domain_els[domain_els.length-1];
			}
	        chrome.extension.sendRequest({type: 'login', domain: cookie_domain});
		}
  }
}

detectLogin();
