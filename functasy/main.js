'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const sugar = require('../syntactic-sugar');
const functasy = require('.');

const SUGAR = 1;

const cwd = __dirname;
const sugarFile = path.join(cwd, 'sugar.txt');
const srcFile = path.join(cwd, 'src.txt');
const inputFile = path.join(cwd, 'input.txt');
const outputFile = path.join(cwd, 'output.txt');

setTimeout(main);

function main(){
  var rules = fs.readFileSync(sugarFile);

  var src = fs.readFileSync(srcFile);
  var input = fs.readFileSync(inputFile);

  if(SUGAR)
    src = sugar.desugarize(rules, src);

  log(src.toString());

  return;

  var eng = new functasy.EngineWithIO(src, input);

  do{
    log(eng.toString());
  }while(!eng.run(1));
}

function buf2str(buf){
  return [...buf].map(byte => {
    return byte
      .toString(2)
      .padStart(8, '0')
      .split('')
      .reverse()
      .join('')
      .match(/.{4}/g)
      .join(' ');
  }).join(' ');
}