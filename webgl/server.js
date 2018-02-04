'use strict';

var http = require('http');

var port = 1037;

module.exports = {
  create
};

function create(){
  http.createServer(listener).listen(port);
}

function listener(req, res){
  res.end();
}