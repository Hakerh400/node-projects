'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const Prover = require('.');

const cwd = __dirname;
const logicalSystemFile = path.join(cwd, 'logical-system.txt');
const inputFile = path.join(cwd, 'input.txt');
const outputFile = path.join(cwd, 'output.txt');

setTimeout(main);

function main(){
  var input = fs.readFileSync(inputFile, 'utf8');
  var output = getOutput(input);

  fs.writeFileSync(outputFile, String(output));
}

function getOutput(input){
  var prover = getProver();
  var proof = prover.checkProof(input);

  return proof;
}

function getProver(){
  var logicalSystemStr = fs.readFileSync(logicalSystemFile, 'utf8');
  var prover = Prover.from(logicalSystemStr);

  return prover;
}