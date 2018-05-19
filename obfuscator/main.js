'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var obfuscator = require('.');

var cwd = __dirname;
var inputFile = path.join(cwd, 'input.txt');
var outputFile = path.join(cwd, 'output.js');

setTimeout(main);

function main(){
  var input = fs.readFileSync(inputFile, 'utf8');
  var output = obfuscator.obfuscate(input);

  fs.writeFileSync(outputFile, output);

  var func = new Function(output);
  func();
}