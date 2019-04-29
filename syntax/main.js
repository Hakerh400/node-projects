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

  const graph = ast.compile({
    script: d => d.fst.fst,
    expr: d => d.fst.fst,
    op: d => d.fst.fst,
    add: d => ['add', d.elems[0].fst, d.elems[2].fst],
    mul: d => ['mul', d.elems[0].fst, d.elems[2].fst],
    num: d => ['num', String(d)],
  });

  let output;

  {
    const mem = [];
    let i = 0;

    const input = [];
    output = [];

    const exec = inst => {
      const type = inst[0];
      const args = inst.slice(1);

      switch(type){
        case 'num': return args[0] | 0; break;
        case 'add': return exec(args[0]) + exec(args[1]); break;
        case 'mul': return exec(args[0]) * exec(args[1]); break;
      }
    };

    output = String(exec(graph));
    log(output);
  }

  O.wfs(outputFile, output);
}