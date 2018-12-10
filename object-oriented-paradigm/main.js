'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const functasy = require('../../Functasy');

const cwd = __dirname;
const srcFile = path.join(cwd, 'src.js');
const inputFile = path.join(cwd, 'input.txt');
const outputFile = path.join(cwd, 'output.txt');

setTimeout(main);

function main(){
  const src = fs.readFileSync(srcFile, 'utf8');
  const input = fs.readFileSync(inputFile);

  const io = new functasy.IO(input);

  const meta = () => meta;
  const read = f => io.read() ? f(meta) : f;
  const write0 = f => (io.write(0), f);
  const write1 = f => (io.write(1), f);

  const func = new Function('_meta', '_read', '_write0', '_write1', src);
  func(meta, read, write0, write1);

  const output = io.getOutput();
  fs.writeFileSync(outputFile, output);
}