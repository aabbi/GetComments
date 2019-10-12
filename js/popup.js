import { HackerNews } from './hackerNews.js';
import { Reddit } from './reddit.js';

document.addEventListener('DOMContentLoaded', function() {
    getCurrentTabUrl(function(url) {
	setDisplayUrl(url);
	let hn = new HackerNews();
	let reddit = new Reddit();
	pageLinks = document.getElementById("pageLinks");
	var sites = [hn, reddit];
	sites.forEach(function(site) {
	    createTable(site.name);
	    createCommentPageLinksTable(site.create_searching_page(), site.name);
	});

	sites.forEach(function(site){
	    site.get_pages(url, function(pages){
		if (pages.length == 0) {
		    var pages = site.create_no_results_page();
		}
		createCommentPageLinksTable(pages, site.name);
	    });
	})
    });
});

function setDisplayUrl(url) {
    var urlobj = new URL(url);
    var displayText = urlobj.host + urlobj.pathname;
    document.getElementById("requestUrl").textContent = displayText;
}

function createTable(name) {
    var tableId = name + "Table";
    var tableElement = document.createElement("table");
    tableElement.setAttribute("id", tableId)
    var pageLinks = document.getElementById("pageLinks");
    pageLinks.appendChild(tableElement);
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
	var iconCell = createIconCell(pages[i].icon);
	var commentsCell = document.createElement("td");
	getCommentsCellElements(pages[i]).forEach(function(ele) {
	    commentsCell.append(ele);
	})
	trow.appendChild(iconCell);
	trow.appendChild(commentsCell);
	table.appendChild(trow);
    }
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
	var commentsLink = document.createElement("a");
	commentsLink.href = page.url;
	commentsLink.target = "_blank";
	commentsLink.textContent = page.title;
	var linebreaker = document.createElement("br");
	var commentTextElement = document.createTextNode(page.num_comments + " Comments");
	var elementList = [commentsLink, linebreaker, commentTextElement]
    } else {
	var elementList = [document.createTextNode(page.title)];
    }
    return elementList;
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






