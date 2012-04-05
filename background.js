// Copyright (c) 2012 

//Logs anytime a cookie is changed.
chrome.cookies.onChanged.addListener(
    function(info) 
    {
      console.log("onChanged" + JSON.stringify(info));
    }
);

