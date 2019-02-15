'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Syntax = require('.');

const DIR = 1;

const cwd = __dirname;
const examplesDir = path.join(cwd, 'examples');
const exampleDir = path.join(examplesDir, 'JavaScript')

const testDir = path.join(cwd, 'test');
const srcFile = path.join(testDir, 'src.txt');
const inputFile = path.join(testDir, 'input.txt');
const outputFile = path.join(testDir, 'output.txt');

setTimeout(main);

function main(){
  const src = fs.readFileSync(srcFile, 'utf8');
  const input = fs.readFileSync(inputFile, 'utf8');

  const syntax = DIR ?
    Syntax.fromDir(exampleDir) :
    Syntax.fromStr(src);

  fs.writeFileSync(outputFile, '');
}