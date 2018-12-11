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
  var input = fs.readFileSync(inputFile, 'utf8');

  var syntax = new Syntax(src);
  var pd = getOutput(syntax, input);

  if(pd === null){
    log('null');
    return;
  }

  pd.iter('expr19', pd => log(pd.toString()));

  fs.writeFileSync(outputFile, pd);
}

function getOutput(syntax, input){
  var output = syntax.parse(input, 'script');
  return output;
}