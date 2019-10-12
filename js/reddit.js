import { CommentSite } from './commentSite.js';

export class Reddit extends CommentSite{
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

