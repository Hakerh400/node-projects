'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const formatFileName = require('../format-file-name');
const RandCode = require('.');

const outputFile = formatFileName('-dw/1.txt');

setTimeout(main);

function main(){
  var gen = new RandCode();
  var code = gen.sample();

  fs.writeFileSync(formatFileName(outputFile));
}