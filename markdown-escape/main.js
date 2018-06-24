'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var mdEsc = require('.');

var cwd = __dirname;
var inputFile = path.join(cwd, 'input.md');
var outputFile = path.join(cwd, 'output.md');

setTimeout(main);

function main(){
  var input = fs.readFileSync(inputFile, 'utf8');
  var output = mdEsc.escape(input);

  fs.writeFileSync(outputFile, output);
}