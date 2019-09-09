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
  // const input = O.rfs(inputFile);
  // const output = esolang(src, input);

  const a = log(O.ca(O.randInt(20, .9), () => O.rand(2)).join(''));
  log(esolang(src, a).toString());

  // log(output.toString());
  // O.wfs(outputFile, output);
}