'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const Syntax = require('.');

const cwd = __dirname;
const srcFile = path.join(cwd, 'src.txt');
const inputFile = path.join(cwd, 'input.txt');
const outputFile = path.join(cwd, 'output.txt');

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile, 'utf8');
  var input = fs.readFileSync(inputFile);

  var syntax = new Syntax(src);
  var output = getOutput(syntax, input);

  fs.writeFileSync(outputFile, output);
}

function getOutput(syntax, input){
  return input;
}