'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const Engine = require('./engine');

const cwd = __dirname;
const fsrc = path.join(cwd, 'src.txt');
const fin = path.join(cwd, 'input.txt');
const fout = path.join(cwd, 'output.txt');

setTimeout(main);

function main(){
  const src = O.rfs(fsrc, 1);
  const input = O.rfs(fin);
  const eng = new Engine(src, input);
  const output = eng.run();
  O.wfs(fout, output);
}