// api/keywords.js

// =======================
// get the packages we need ============
// =======================
var express  = require('express');
var router   = express.Router();
var util     = require('../util');
var google   = require('google');
google.resultsPerPage = 25;
google.lang = 'fr';
google.tld = 'fr';
var nextCounter = 0;

router.get('/',
function(req, res, next){
  res.json({success:true, data:"heroes"});
  console.log("hello world");
  google('raiseapp', function (err, res){
    if (err) console.error(err);

    for (var i = 0; i < res.links.length; ++i) {
      var link = res.links[i];
      console.log(i + ":" + link.title);
      // console.log(link.description + "\n");
    }

    if (nextCounter < 4) {
      nextCounter += 1;
      if (res.next) res.next();
    }
  });
}
);

module.exports = router;
