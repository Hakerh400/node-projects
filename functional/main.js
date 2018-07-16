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
const inputFile = path.join(programDir, 'input.txt');
const outputFile = path.join(programDir, 'output.txt');

setTimeout(main);

function main(){
  var header = fs.readFileSync(headerFile, 'utf8');
  var src = fs.readFileSync(srcFile, 'utf8');
  var input = fs.readFileSync(inputFile);

  var parsed = parser.parse([header, src]);
  var compiled = compiler.compile(parsed);

  var machine = new Machine(compiled);
  var io = new IO(input);

  machine.setProp('io', io);

  machine.on('exit', () => {
    var output = io.getOutput();
    fs.writeFileSync(outputFile, output);
  });

  machine.start();
}