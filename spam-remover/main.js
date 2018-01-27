'use strict';

var path = require('path');
var spamRemover = require('.');

var inputDir = './input';
var outputDir = './output';

setTimeout(main);

function main(){
  var cwd = process.cwd();

  inputDir = path.join(cwd, inputDir);
  outputDir = path.join(cwd, outputDir);

  spamRemover.remove(inputDir, outputDir);;
}