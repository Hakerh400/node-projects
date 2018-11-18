'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const functasy = require('.');

const cwd = __dirname;
const srcFile = path.join(cwd, 'src.txt');
const inputFile = path.join(cwd, 'input.txt');
const outputFile = path.join(cwd, 'output.txt');

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile);
  var input = fs.readFileSync(inputFile);

  var output = functasy.run(src, input);
  fs.writeFileSync(outputFile, output);
}