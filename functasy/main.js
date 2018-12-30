'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const functasy = require('.');

const cwd = __dirname;
const srcFile = path.join(cwd, 'src.txt');
const inputFile = path.join(cwd, 'input.txt');
const outputFile = path.join(cwd, 'output.txt');

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile);
  var input = fs.readFileSync(inputFile);

  var output = functasy.run(src, input, functasy.IO, 1, 1e5, 'utf8');
  fs.writeFileSync(outputFile, output);
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