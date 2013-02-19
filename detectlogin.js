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
