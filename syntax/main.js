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
    script: d => d.fst.arr,
    inst: d => d.fst.fst,
    move: d => d.fst.fst,
    left: d => 'left',
    right: d => 'right',
    upd: d => d.fst.fst,
    inc: d => 'inc',
    dec: d => 'dec',
    io: d => d.fst.fst,
    in: d => 'in',
    out: d => 'out',
    loop: d => d.elems[1].arr,
  });

  let output;

  {
    const mem = [];
    let i = 0;

    const input = [];
    output = [];

    const exec = inst => {
      switch(inst){
        case 'left': i--; break;
        case 'right': i++; break;
        case 'inc': mem[i] = -~mem[i] & 255; break;
        case 'dec': mem[i] = ~-mem[i] & 255; break;
        case 'in': mem[i] = input.shift() & 255; break;
        case 'out': output.push(mem[i] & 255); break;

        default:
          const loop = inst;
          while((mem[i] & 255) !== 0)
            for(const inst of loop)
              exec(inst);
          break;
      }
    };

    for(const inst of graph)
      exec(inst);

    output = Buffer.from(output);
  }

  O.wfs(outputFile, output);
}