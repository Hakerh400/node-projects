'use strict';

var path = require('path');
var spamRemover = require('.');

var inputDir = './test/input';
var outputDir = './test/output';

setTimeout(main);

function main(){
  var cwd = __dirname;

  inputDir = path.join(cwd, inputDir);
  outputDir = path.join(cwd, outputDir);

  spamRemover.remove(inputDir, outputDir);;
}