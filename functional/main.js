'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const compiler = require('./compiler');
const Machine = require('./machine');
const IO = require('./io');

const cwd = __dirname;
const programDir = path.join(cwd, 'program');
const srcFile = path.join(programDir, 'src.txt');
const tokenizedFile = path.join(programDir, 'tokenized.txt');
const parsedFile = path.join(programDir, 'parsed.txt');
const compiledFile = path.join(programDir, 'compiled.hex');
const inputFile = path.join(programDir, 'input.txt');
const outputFile = path.join(programDir, 'output.txt');

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile, 'ascii');
  var input = fs.readFileSync(inputFile);

  var tokenized = tokenizer.tokenize(src);
  fs.writeFileSync(tokenizedFile, tokenized.toString());

  var parsed = parser.parse(tokenized);
  fs.writeFileSync(parsedFile, parsed.toString());

  var compiled = compiler.compile(parsed);
  fs.writeFileSync(compiledFile, compiled);

  var machine = new Machine(compiled);
  var io = new IO(machine, input);

  var t = Date.now();
  machine.start();
  log(((Date.now() - t) / 1e3).toFixed(3));

  var output = io.getOutput();
  fs.writeFileSync(outputFile, output);
}