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