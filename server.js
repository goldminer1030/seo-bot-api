// server.js

// =======================
// get the packages we need ============
// =======================
var express    = require('express');
var app        = express();
var path       = require('path');
var mongoose   = require('mongoose');
var bodyParser = require('body-parser');
var morgan     = require('morgan');

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 3000; // used to create, sign, and verify
var config = require('./config'); // get our config file tokens

// Database
mongoose.Promise = global.Promise;
mongoose.connect(config.database, {useMongoClient: true});
var db = mongoose.connection;
db.once('open', function () {
  console.log('DB connected!');
});
db.on('error', function (err) {
  console.log('DB ERROR:', err);
});

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
app.use('/api/users', require('./api/users')); // route users
app.use('/api/auth', require('./api/auth'));   // route auth

// Server
app.listen(port, function(){
  console.log('listening on port:' + port);
});
