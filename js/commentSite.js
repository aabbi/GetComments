export class CommentSite {
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


function encodeQueryData(data) {
   let ret = [];
   for (let d in data)
     ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
   return ret.join('&');
}
