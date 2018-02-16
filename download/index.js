'use strict';

var fs = require('fs');
var http = require('http');
var https = require('https');
var O = require('../framework');
var formatFileName = require('../format-file-name');

module.exports = download;

function download(url, file, func = O.nop, cb = O.nop){
  file = formatFileName(file);

  var nodeModule = url.startsWith('https') ? https : http;

  nodeModule.get(url, res => {
    var headers = res.headers;
    var len = null;

    if('content-length' in headers){
      len = headers['content-length'];
    }

    var fsStream = fs.createWriteStream(file);
    var i = 0;

    res.on('data', data => {
      i += data.length;
      func(data, i, len);
      fsStream.write(data);
    });

    res.on('end', () => {
      cb();
    });
  });
}