'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const parser = require('./parser.js');
const compiler = require('./compiler.js');
const Machine = require('./machine.js');
const IO = require('./io.js');

const cwd = __dirname;
const programDir = path.join(cwd, 'program');
const headerFile = path.join(programDir, 'header.txt');
const srcFile = path.join(programDir, 'src.txt');
const parsedFile = path.join(programDir, 'parsed.txt');
const compiledFile = path.join(programDir, 'compiled.hex');
const inputFile = path.join(programDir, 'input.txt');
const outputFile = path.join(programDir, 'output.txt');

setTimeout(main);

function main(){
  var header = fs.readFileSync(headerFile, 'utf8');
  var src = fs.readFileSync(srcFile, 'utf8');
  var input = fs.readFileSync(inputFile);

  var parsed = parser.parse([header, src]);
  fs.writeFileSync(parsedFile, parsed.toString());

  var compiled = compiler.compile(parsed);
  fs.writeFileSync(compiledFile, compiled.getBuff());

  var machine = new Machine(compiled);
  var io = new IO(input);
  var intface = io.getIntface();

  machine.setProp('io', intface);

  machine.on('exit', () => {
    var output = io.getOutput();
    fs.writeFileSync(outputFile, output);
  });

  machine.start();
}