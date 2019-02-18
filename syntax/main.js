'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Syntax = require('.');

const TEST = 0;

const cwd = __dirname;
const examplesDir = path.join(cwd, 'examples');
const exampleDir = path.join(examplesDir, 'JavaScript');
const ctxFile = path.join(exampleDir, 'context.js');

const testDir = path.join(cwd, 'test');
const srcFile = path.join(testDir, 'src.txt');
const inputFile = path.join(testDir, 'input.txt');
const outputFile = path.join(testDir, 'output.txt');

setTimeout(main);

function main(){
  const src = TEST ? O.rfs(srcFile, 1) : null;
  const ctxCtor = require(ctxFile);

  const input = O.rfs(inputFile, 1);

  const syntax = TEST ?
    Syntax.fromStr(src, ctxCtor) :
    Syntax.fromDir(exampleDir, ctxCtor);

  const output = syntax.parse(input, 'script');

  O.wfs(outputFile, output);
}