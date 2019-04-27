'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Syntax = require('.');

const TEST = 1;

const cwd = __dirname;
const examplesDir = path.join(cwd, 'examples');
const exampleDir = path.join(examplesDir, 'javascript');
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

  const ast = syntax.parse(input, 'script');

  const output = ast.compile({
    script: d => String(d.fst.fst),
    expr: d => d.fst.fst,
    op: d => d.fst.fst,
    add: d => d.fst.fst + d.elems[2].fst,
    exp: d => d.fst.fst ** d.elems[2].fst,
    num: d => +d,
  });

  log(output);

  O.wfs(outputFile, output);
}