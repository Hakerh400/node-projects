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
  const output = esolang(src, input);

  O.wfs(outputFile, output);
}