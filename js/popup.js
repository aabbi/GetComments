function encodeQueryData(data) {
   let ret = [];
   for (let d in data)
     ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
   return ret.join('&');
}

class CommentSite {
    constructor() {
	this.max_hits = 1;
    };

    clean_url(url) {
	return url.split('#')[0];
    }

    remove_extra_params(url) {
	if(url.indexOf('?') > -1) {
	    url = url.split('?')[0];
	}
	return url;
    }

    construct_request(link) {
	var self = this;
	var query_params = self.construct_query_params(link);
	var searchUrl = self.search_url + "?" + encodeQueryData(query_params);
	var x = new XMLHttpRequest();
	x.open('GET', searchUrl);
	x.responseType = 'json';
	return x;
    }

    get_top_hits(response) {
	var self = this;
	var top_hits = []
	var hits = self.parse_response(response);
	if (hits.length > 0) {
	    var sorted_hits = hits.sort(function (a, b) {
		return b.num_comments - a.num_comments;
	    });
	    top_hits = sorted_hits.slice(0, self.max_hits);		
	}
	return top_hits
    }

    search_truncated(link, callback) {
	var self = this;
	var x = self.construct_request(link);
	x.onload = function() {
	    var top_hits = self.get_top_hits(x.response);
	    callback(top_hits);    
	}
	x.send();
    }

    search_site(link, callback){
	var self = this;
	var clean_url = self.clean_url(link);
	var x = self.construct_request(clean_url);
	
	x.onload = function() {
	    var docallback = true;
	    var top_hits = self.get_top_hits(x.response);
	    if (top_hits.length == 0) {
	    	var no_params_url = self.remove_extra_params(clean_url);
	    	if (no_params_url != clean_url) {
	    	    self.search_truncated(no_params_url, callback);
		    docallback = false;
	    	} 
	    }
	    if(docallback){
	    	callback(top_hits);
	    }
	};	

	x.send();
    }
    
    create_pages_from_results(results) {
    };

    create_no_results_page() {
	var pages = [];
	pages.push({
                "title": "No discussions found :(",
                "url": "",
                "num_comments": 0,
		"icon": this.icon
	});
        return pages;
    }    
    
    create_searching_page() {
	var pages = [];
	pages.push({
            "title": "Searching " + this.name ,
            "url": "",
            "num_comments": 0,
	    "icon": "img/ajax-loader.gif"
	});
        return pages;
    }

    get_pages(link, callback) {
	var self=this
        self.search_site(link, function(search_results) {
	    var pages = self.create_pages_from_results(search_results);
	    callback(pages);
	});
    }
}

class HackerNews extends CommentSite{
    constructor() {
	super();
	this.icon = "https://news.ycombinator.com/favicon.ico";
        this.search_url = "http://hn.algolia.com/api/v1/search";
        this.page_url = "https://news.ycombinator.com/item?id=";
	this.name = "HackerNews"
    }

    construct_query_params(link) {
        return { "query" : link,
                 "tags": "story" ,
		 "restrictSearchableAttributes":"url"
	       };
    }

    parse_response(response) {
	if (response && response.hits) {
	    return response.hits;
	} else {
	    return [];
	}
    }

    create_pages_from_results(results){
        var pages = [];
        for (var i=0;i<results.length;i++){
	    var r = results[i];
	    pages.push({
                "title": r["title"],
                "url": this.page_url + r["objectID"],
                "num_comments": r["num_comments"],
		"icon": this.icon
	    })
	}
        return pages;	
    }
}


class Reddit extends CommentSite{
    constructor() {
	super();
	this.icon = "https://www.reddit.com/favicon.ico";
        this.search_url = "https://www.reddit.com/search.json";
        this.page_url = "https://www.reddit.com";
	this.name = "Reddit"
    }

    construct_query_params(link) {
        return { "q" : link,
		 "sort": "comments",
		 "t":"all",
                 "limit": self.maxHits };	
    }

    parse_response(response) {
	if (response && response.data && response.data.children) {
	    return response.data.children;
	} else {
	    return [];
	}
    }    


    create_pages_from_results(results){
        var pages = [];
        for (var i=0;i<results.length;i++){
	    var r = results[i].data;
	    pages.push({
                "title": r["title"],
                "url": this.page_url + r["permalink"],
                "num_comments": r["num_comments"],
		"icon": this.icon
	    })
	}
        return pages;	
    }
}


/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

function createIconCell(icon_src) {
    var tcell = document.createElement("td");
    var iconImg = document.createElement("img");
    iconImg.src = icon_src;
    iconImg.classList.add("icon");
    tcell.appendChild(iconImg);
    return tcell
}

function getCommentsCellElements(page) {
    if (page.url) {
	commentsLink = document.createElement("a");
	commentsLink.href = page.url;
	commentsLink.target = "_blank";
	commentsLink.textContent = page.title;
	linebreaker = document.createElement("br");
	commentTextElement = document.createTextNode(page.num_comments + " Comments");
	elementList = [commentsLink, linebreaker, commentTextElement]
    } else {
	elementList = [document.createTextNode(page.title)];
    }
    return elementList;
}

function createCommentPageLinksTable(pages, site_name) {
    var tableId = site_name + "Table";
    var table = document.getElementById(tableId);
    while (table.firstChild) {
	table.removeChild(table.firstChild);
    }
    table.appendChild(document.createElement("th"))
    for (var i=0;i<pages.length;i++) {
	var trow = document.createElement("tr");
	iconCell = createIconCell(pages[i].icon);
	commentsCell = document.createElement("td");
	getCommentsCellElements(pages[i]).forEach(function(ele) {
	    commentsCell.append(ele);
	})
	trow.appendChild(iconCell);
	trow.appendChild(commentsCell);
	table.appendChild(trow);
    }
}

function createTable(name) {
    var tableId = name + "Table";
    tableElement = document.createElement("table");
    tableElement.setAttribute("id", tableId)
    pageLinks = document.getElementById("pageLinks");
    pageLinks.appendChild(tableElement);
}

function setDisplayUrl(url) {
    urlobj = new URL(url);
    displayText = urlobj.host + urlobj.pathname;
    document.getElementById("requestUrl").textContent = displayText;
}


document.addEventListener('DOMContentLoaded', function() {
    getCurrentTabUrl(function(url) {
	setDisplayUrl(url);
	let hn = new HackerNews();
	let reddit = new Reddit();
	pageLinks = document.getElementById("pageLinks");
	sites = [hn, reddit];
	sites.forEach(function(site) {
	    createTable(site.name);
	    createCommentPageLinksTable(site.create_searching_page(), site.name);
	});

	sites.forEach(function(site){
	    site.get_pages(url, function(pages){
		if (pages.length == 0) {
		    pages = site.create_no_results_page();
		}
		createCommentPageLinksTable(pages, site.name);
	    });
	})
    });
});
