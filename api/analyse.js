// api/analyse.js

// =======================
// get the packages we need ============
// =======================
var express  = require('express');
var router   = express.Router();
var request  = require('request');
var hma      = require('hma-proxy-scraper');
var cheerio  = require('cheerio');
var util     = require('../util');
var config   = require('../config'); // get our config file tokens

router.post('/', util.isValidToken, function(req,res,next){
  if(!req.isValidToken) return res.json(util.successFalse(null,'Invalid token!'));
  if(!req.body.url) return res.json(util.successFalse(null, "parameter error"));

  // get proxies
  hma.getProxies(function (err,proxies) {
    if(err) return res.json(util.successFalse(err));

    var reqOpts = {
      url: req.body.url,
      method: "GET",
      headers: {
        "User-Agent":     "Chrome/27.0.1453.110",
        "Content-Type" :  "application/x-www-form-urlencoded",
        "Cache-Control" : "no-cache"
      },
      proxy: proxies[Math.floor(proxies.length * Math.random())]
    };

    console.log('Analysing url: ' + req.body.url);

    request(reqOpts, function(error, response, body) {
      if(error) return res.json(util.successFalse(error));
      if(!body) res.json(util.successFalse(null, "parsing error"));

      var $ = cheerio.load(body.replace(/<!--|-->/g, '')),
      resultData = [],
      textLength = 0,
      contentLength = response.headers['content-length'],
      title = $('head title').text(),
      desc = $('meta[name="description"]').attr('content'),
      kwd = $('meta[name="keywords"]').attr('content'),
      headlines = $('h1, h2, h3, h4, h5, h6'),
      strong = $('strong'),
      internalLink = $("a[href^='/']"),
      externalLink = $("a[href^='http']"),
      followLink = $("a[rel^='nofollow']"),
      allLink = $('a'),
      images = $('img');

      $('p, span, a').each(function( index ) {
        textLength += $(this).text().replace(/(?:\r\n|\r|\n)/g, '').length;
      });

      var codeToTextRatio = 0;
      if(textLength > 0 && contentLength > 0) {
        codeToTextRatio = textLength / contentLength * 100;
      }

      resultData.push(getArray('Ratio text/code', codeToTextRatio.toFixed(2) + '%'));
      resultData.push(getArray('Headlines', headlines.length));
      resultData.push(getArray('Number of strong', strong.length));
      resultData.push(getArray('Count images', images.length));
      resultData.push(getArray('Meta title', title));
      resultData.push(getArray('Meta description', desc));
      resultData.push(getArray('Meta keywords', kwd));
      resultData.push(getArray('Number of follow links', followLink.length));
      resultData.push(getArray('Number of internal links', internalLink.length));
      resultData.push(getArray('Number of external links', externalLink.length));

      return res.json(util.successAnalyseData(req.body.url, resultData));
    });
  });
});

// private function
function getArray(key, value) {
  var data = {};
  if(value)
    data[key] = value;
  else
    data[key] = 0;

  return data;
}

module.exports = router;
