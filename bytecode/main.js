'use strict';

var fs = require('fs');
var bytecode = require('.');

var srcFile = './src.txt';
var inputFile = './input.txt';
var outputFile = './output.txt';

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile).toString();
  var input = fs.readFileSync(inputFile).toString();
  var program = bytecode.compile(src);
  var result = program.exec(input);
  var resultStr = `${result}`;

  fs.writeFileSync(outputFile, result);
}