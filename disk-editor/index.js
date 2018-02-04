'use strict';

var fs = require('fs');

var fd = fs.openSync('\\\\C:\\', 'r');

module.exports = {
  read
};

function read(sector){}