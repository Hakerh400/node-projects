'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const Sequence = require('.');

const dir = O.dirs.dw;
const inputFile = path.join(dir, 'input.txt');
const outputFile = path.join(dir, 'output.txt');

setTimeout(main);

function main(){
  var input = fs.readFileSync(inputFile, 'utf8');

  var seq = new Sequence(5);

  for(var i = 0; i !== input.length; i++)
    seq.add(input[i]);

  var sample = seq.sample();
  fs.writeFileSync(outputFile, sample);
}