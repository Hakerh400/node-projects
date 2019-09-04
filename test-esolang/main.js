'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const esolang = require('.');

const cwd = __dirname;
const testDir = path.join(cwd, 'test');
const srcFile = path.join(testDir, 'src.txt');
const inputFile = path.join(testDir, 'input.txt');
const outputFile = path.join(testDir, 'output.txt');

setTimeout(main);

function main(){
  const src = O.rfs(srcFile);
  const input = O.rfs(inputFile);
  // const output = esolang(src, input);

  for(let i = 0; i !== 256; i++){
    const j = esolang(src, Buffer.from([i]))[0];
    log(String(parseInt(O.rev(i.toString(2).padStart(8, '0')), 2)).padEnd(5), j);
  }

  // log(output.toString());
  // O.wfs(outputFile, output);
}