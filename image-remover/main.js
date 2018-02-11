'use strict';

var path = require('path');
var imageRemover = require('.');

var input = 'input';
var output = 'output';

setTimeout(main);

function main(){
  var cwd = process.cwd();
  var inputDir = path.join(cwd, input);
  var outputDir = path.join(cwd, output);

  imageRemover.remove(inputDir, outputDir, err => {
    if(err) return console.log(err);
    console.log('Finished.');
  });
}