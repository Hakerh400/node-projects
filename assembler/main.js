'use strict';

var fs = require('fs');
var O = require('../framework');
var assembler = require('.');

var srcFile = './src/src.txt';

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile);
  var machine = new assembler.Machine();

  machine.addPers([
    'mboard',
    'timer',
    'input',
    'output',
  ]);

  machine.compile(src);
  machine.start();
}