import { CommentSite } from './commentSite.js';

export class HackerNews extends CommentSite{
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
