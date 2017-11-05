// api/keywords.js

// =======================
// get the packages we need ============
// =======================
var express  = require('express');
var router   = express.Router();
var request  = require('request');
var async    = require('async');
var cheerio  = require('cheerio');
var hma      = require('hma-proxy-scraper');
var util     = require('../util');
var config   = require('../config'); // get our config file tokens
var totalResults = 0;

router.put('/', util.isValidToken, function(req,res,next){
  if(!req.isValidToken) return res.json(util.successFalse(null,'Invalid token!'));

  var url = req.body.url,
      keywords = req.body.keywords;

  if(!url || !keywords || !Array.isArray(keywords) || keywords.length < 1) {
    return res.json(util.successFalse("parameter error"));
  }

  console.log('url: ' + url);

  // get proxies
  hma.getProxies(function (err,proxies) {
    if(err) return res.json(util.successFalse(err));

    var resultData = [];
    var queue = async.queue(function (task, callback) {
      var domain = extractRootDomain(url);
      var reqOpts = {
      	url: task.url,
      	method: "GET",
      	headers: {"Cache-Control" : "no-cache"},
      	proxy: proxies[Math.floor(proxies.length * Math.random())]
    	};

      request(reqOpts, function(error, response, body) {
        if (error) {
    			console.trace("Couldn’t get Google page because of error.");
    			console.error(error.stack);
          callback(); //Tell async that this queue item has been processed
    			return res.json(util.successFalse(error));
    		}
        // load the body of the page into Cheerio so we can traverse the DOM
    		var $ = cheerio.load(body), result = $(".g"), json = [], heading = "", url = "", keywordsPosition = parseInt(config.num), match = false;

    		if (result.length === 0) {
    			console.log("Keyword Rank Checker Issue with HTML Response from Google", JSON.stringify(body));
    		} else {
    		  result.each(function (i, link) {
            heading = $(link).find('h3').text();
  			    url = $(link).find('h3 a').attr("href");
  			    rank = i + 1;

            // strip out unnecessary junk
            if(url != undefined) {
    					url = url.replace("/url?q=", "").split("&")[0];

    					if (url.charAt(0) === "/") {
    						return;
    					}

    					if (!match && url.search(domain) != -1) {
                keywordsPosition = rank;
    						match = true;
    					}
    				}
    				totalResults++;
          });
    		}
        callback(null, keywordsPosition); //Tell async that this queue item has been processed
      });
    }, 5);

    // assign a callback
    queue.drain = function() {
      console.log('all items have been processed');
      return res.json(util.successKeywordsPosition(url, resultData));
    };

    // loop keyword
    keywords.forEach(function(keyword) {
      var checkingURL = config.region + "/search?num=" + config.num + "&q=" + keyword + "&ie=utf-8&oe=utf-8&tbs=li:1&pws=0";
      queue.push({ url: checkingURL }, function (err, keywordsPosition) {
        var data = {};
        data[keyword] = keywordsPosition;
        resultData.push(data);
        console.log('finished processing -- key: ' + keyword + ', position: '+ keywordsPosition);
      });
    });
  });
});

// private functions
function extractHostname(url) {
  var hostname;
  //find & remove protocol (http, ftp, etc.) and get hostname

  if (url.indexOf("://") > -1) {
    hostname = url.split('/')[2];
  } else {
    hostname = url.split('/')[0];
  }

  //find & remove port number
  hostname = hostname.split(':')[0];
  //find & remove "?"
  hostname = hostname.split('?')[0];

  return hostname;
}

function extractRootDomain(url) {
  var domain = extractHostname(url),
      splitArr = domain.split('.'),
      arrLen = splitArr.length;

  //extracting the root domain here
  //if there is a subdomain
  if (arrLen > 2) {
    domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
    //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
    if (splitArr[arrLen - 1].length == 2 && splitArr[arrLen - 1].length == 2) {
      //this is using a ccTLD
      domain = splitArr[arrLen - 3] + '.' + domain;
    }
  }

  return domain;
}

module.exports = router;
