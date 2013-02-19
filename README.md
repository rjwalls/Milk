#About

We created Milk to illustrate the concept of functional privacy. Milk is
designed to limit cross-site tracking without reducing functionality for the
user. The general idea is to restrict, or bind, cookies to the first-party site
from which they were created rather than disabling cookies entirely. 

Send questions and comments to milkhelp@cs.umass.edu.


#Algorithm Overview

Milk implements cookie binding by intercepting cookies both before they are
stored and before they are sent. Imagine this simplified example using a single
first-party site. When the user visits example.com, the server responds with an
HTTP Set-Cookie header instructing the browser to store a cookie. Milk will
rewrite the cookie before it is stored, appending the key "example.com!!!" to
the cookie’s name. For subsequent web requests to example.com, Milk will rewrite
the HTTP Cookie header to both remove the domain-specific keys and ensure that
only cookies with the appropriate key are sent back to the server. 

See http://forensics.umass.edu/milk.php for more information.


#Loading the Extension (from source) 

Load the extension by clicking (Wrench)->Tools->Extensions to bring up the extensions window. Make sure the
"Developer mode" box is checked. Click the "Load unpacked extension" button and
navigate to the directory holding the extension source.


#Before first use

For best results, make sure to remove all existing cookies. You can do this by
selecting (Wretch) -> History -> Clear all browsing data... -> Check the box for
"Delete cookies and other site and plug-in data" -> Clear browsing data.


#View the console

On the Extensions tab, select the arrow to the left of the extensions name to
view additional information and options. Click the link
"_generated_background_page.html".

#License

Copyright (C) 2012 Robert Walls and Shane Clark

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.


