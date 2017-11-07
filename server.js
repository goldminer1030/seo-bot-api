// server.js

// =======================
// get the packages we need ============
// =======================
var express    = require('express');
var app        = express();
var path       = require('path');
var bodyParser = require('body-parser');
var morgan     = require('morgan');

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8000; // used to create, sign, and verify
var config = require('./config'); // get our config file tokens

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// use morgan to log requests to the console
app.use(morgan('dev'));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'content-type, x-access-token'); // add x-access-token to CORS
  next();
});

// API
app.use('/api/keywords', require('./api/keywords'));   // route keywords
app.use('/api/analyse', require('./api/analyse'));   // route analyse

// Server
app.listen(port, function(){
  console.log('listening on port:' + port);
});
