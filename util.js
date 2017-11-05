//util.js

var jwt    = require('jsonwebtoken');
var crypto = require('crypto');
var config = require('./config'); // get our config file tokens

var util = {};

util.successTrue = function(data){ //create success json
  return {
    success:true,
    message:null,
    errors:null,
    data:data
  };
};

util.successKeywordsPosition = function(url, data){ //create success task json
  return {
    url:url,
    keywords:data
  };
};

util.successAnalyseData = function(url, data){ //create success task json
  return {
    url:url,
    data:data
  };
};

util.successFalse = function(err, message){ //create fail json
  if(!err&&!message) message = 'data not found';
  return {
    success:false,
    message:message,
    errors:(err)? util.parseError(err): null,
    data:null
  };
};

util.parseError = function(errors){ //create error while processing resourses via mongoose
  var parsed = {};
  if(errors.name == 'ValidationError'){
    for(var name in errors.errors){
      var validationError = errors.errors[name];
      parsed[name] = { message:validationError.message };
    }
  } else if(errors.code == '11000' && errors.errmsg.indexOf('username') > 0) {
    parsed.username = { message:'This username already exists!' };
  } else {
    parsed.unhandled = errors;
  }
  return parsed;
};


// middlewares
util.isLoggedin = function(req,res,next){ //check if there is token or not, if token, confirm token hash using jwt.verify
  var token = req.headers['x-access-token'];
  if (!token) return res.json(util.successFalse(null,'token is required!'));
  else {
    jwt.verify(token, config.secret, function(err, decoded) {
      if(err) return res.json(util.successFalse(err));
      else{
        req.decoded = decoded;
        next();
      }
    });
  }
};

util.isValidToken = function(req,res,next){ //check if there is token or not, if token, confirm token hash using crypto
  var token = req.headers['x-access-token'];
  if (!token) return res.json(util.successFalse(null,'token is required!'));
  else {
    var decipher = crypto.createDecipher(config.algorithm, config.secret);
    try {
      var decrypted = decipher.update(token, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      req.isValidToken = crypto.timingSafeEqual(new Buffer(decrypted), new Buffer(config.password));
      next();
    } catch (ex) {
      next();
    }
  }
};

module.exports = util;
