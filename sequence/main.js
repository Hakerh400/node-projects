'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const Sequence = require('.');

const MEM_SIZE = 10;
const BINARY = 0;

const EXTENSION = 'txt';

const dir = O.dirs.dw;
const inputFile = path.join(dir, `input.${EXTENSION}`);
const outputFile = path.join(dir, `output.${EXTENSION}`);

setTimeout(main);

function main(){
  var input = fs.readFileSync(inputFile);
  if(!BINARY) input = input.toString('utf8');

  var seq = new Sequence(MEM_SIZE);

  for(var i = 0; i !== input.length; i++)
    seq.add(input[i]);

  var sample = seq.sample(BINARY);
  fs.writeFileSync(outputFile, sample);
}