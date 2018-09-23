'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const formatFileName = require('../format-file-name');
const functional = require('.');

const dir = formatFileName('-projects/Functional');
const srcFile = path.join(dir, 'src.txt');
const inputFile = path.join(dir, 'input.txt');
const outputFile = path.join(dir, 'output.txt');

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile);
  var input = fs.readFileSync(inputFile);

  var machine = new functional.Machine(src, input);

  machine.on('halt', () => {
    var output = machine.getOutput();
    fs.writeFileSync(outputFile, output);
  });

  machine.on('error', err => {
    log('Error occured');
    log(err);
  });

  machine.start();
}