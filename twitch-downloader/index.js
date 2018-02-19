'use strict';

var fs = require('fs');
var https = require('https');
var O = require('../framework');
var formatFileName = require('../format-file-name');

module.exports = {
  download,
};

function download(user, file){
  var url = `https://player.twitch.tv/?channel=${user}&amp;player=facebook&amp;autoplay=true`;
  var filePath = formatFileName(file);
  var fsStream = fs.createWriteStream(filePath);

  downloadChunk(url, fsStream, () => {
    console.log('Finished.');
  });
}

function downloadChunk(url, fsStream, cb = O.nop){
  https.get(url, res => {
    res.on('data', d => fsStream.write(d));
    res.on('end', () => cb(null));
  });
}