'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const Prover = require('.');

const cwd = __dirname;
const logicalSystemFile = path.join(cwd, 'logical-system.txt');
const outputFile = path.join(cwd, 'output.txt');

setTimeout(main);

function main(){
  var output = getOutput();
  fs.writeFileSync(outputFile, output);
}

function getOutput(){
  var logicalSystemStr = fs.readFileSync(logicalSystemFile, 'utf8');
  var prover = Prover.from(logicalSystemStr);
}