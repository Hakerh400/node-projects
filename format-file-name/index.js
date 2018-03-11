'use strict';

var path = require('path');
var O = require('../framework');

module.exports = formatFileName;

function formatFileName(fileName){
  if(fileName[0] == '-' && fileName.length > 1){
    var dir = fileName.match(/[a-zA-Z0-9]+/)[0];

    fileName = fileName.substring(dir.length + 2);
    fileName = path.join(O.dirs[dir], fileName);
  }

  fileName = path.normalize(fileName);

  return fileName;
}