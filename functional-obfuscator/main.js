'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const obfuscate = require('./obfuscate');

const EVAL = 1;

const cwd = __dirname;
const fin = path.join(cwd, 'input.js');
const fout = path.join(cwd, 'output.js');

setTimeout(main);

function main(){
  const input = O.rfs(fin, 1);
  const output = obfuscate(input);

  O.wfs(fout, output);
  if(EVAL) new Function(output)();
}