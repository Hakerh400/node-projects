'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Engine = require('.');

const cwd = __dirname;
const testDir = path.join(cwd, 'test');
const srcFile = path.join(testDir, 'src.txt');
const inputFile = path.join(testDir, 'input.txt');
const outputFile = path.join(testDir, 'output.txt');

setTimeout(main);

function main(){
  const src = O.bits2buf(O.rfs(srcFile, 1));
  const input = O.rfs(inputFile);

  const eng = new Engine(src, input);
  const output = eng.run();
  eng.dispose();

  O.wfs(outputFile, output);
}