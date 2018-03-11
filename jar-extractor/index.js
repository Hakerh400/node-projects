'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var O = require('../framework');
var formatFileName = require('../format-file-name');
var createTempDir = require('../temp-dir');

module.exports = {
  extract,
};

function extract(input, output = null, cb = O.nop){
  if(output === null)
    output = createTempDir(__filename);

  input = formatFileName(input);
  output = formatFileName(output);

  var options = {
    cwd: output,
  };

  cp.exec(`jar -xf "${input}"`, options, (err, stdout, stderr) => {
    if(err) return cb(err, null);
    cb(null, output);
  });
}