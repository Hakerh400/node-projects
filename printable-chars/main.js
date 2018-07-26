'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');

const cwd = __dirname;
const inputFile = path.join(cwd, 'input.hex');
const outputFile = path.join(cwd, 'output.txt');

const CHAR_CODES = ' ~'.split('').map(a => a.charCodeAt(0));

setTimeout(main);

function main(){
  var input = fs.readFileSync(inputFile);
  var output = extractPrintableChars(input);

  fs.writeFileSync(outputFile, output);
}

function extractPrintableChars(chars){
  if(typeof chars === 'string')
    chars = Buffer.from(chars);

  return Buffer.from([...chars].filter(cc => {
    return cc >= CHAR_CODES[0] && cc <= CHAR_CODES[1];
  }));
}