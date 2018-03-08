'use strict';

var fs = require('fs');
var randomStackTraceGenerator = require('.');
var formatFileName = require('../format-file-name');

var linesNum = 1e3;
var output = '-dw/1.txt';

setTimeout(main);

function main(){
  output = formatFileName(output);
  var stackTrace = randomStackTraceGenerator.generate(linesNum);
  fs.writeFileSync(output, stackTrace);
}