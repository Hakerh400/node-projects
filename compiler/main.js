'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var compiler = require('.');

var srcDir = './src';
var compiledDir = './compiled';
var compiledAsmFile = path.join(compiledDir, 'asm.txt');

setTimeout(main);

function main(){
  var compiled = compiler.compileDir('./src');
  fs.writeFileSync(compiledAsmFile, compiled.asm);

  var machine = compiled.machine;

  machine.addPers([
    'mboard',
    'timer',
    'input',
    'output',
  ]);

  machine.start();
}