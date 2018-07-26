'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const tokenizer = require('./tokenizer');
const parser = require('./parser');
const compiler = require('./compiler');
const Machine = require('./machine');
const IO = require('./io');

const GENERATE_TEMP_FILES = 0;
const GENERATE_COMPILED_BINARY = 1;
const DISPLAY_TIME = 1;

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
  save(tokenizedFile, tokenized.toString());

  var parsed = parser.parse(tokenized);
  save(parsedFile, parsed.toString());

  var compiled = compiler.compile(parsed);
  
  if(GENERATE_COMPILED_BINARY)
    fs.writeFileSync(compiledFile, compiled);

  var machine = new Machine(compiled);
  var io = new IO(machine, input);

  var t = Date.now();
  machine.start();

  if(DISPLAY_TIME)
    log(((Date.now() - t) / 1e3).toFixed(3));

  var output = io.getOutput();
  fs.writeFileSync(outputFile, output);
}

function save(file, data){
  if(!GENERATE_TEMP_FILES) return;
  fs.writeFileSync(file, data);
}