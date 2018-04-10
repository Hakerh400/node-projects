'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var Interface = require('../assembler/interface.js');
var compiler = require('.');

var srcDir = './src';
var compiledDir = './compiled';
var compiledAsmFile = path.join(compiledDir, 'asm.txt');

setTimeout(main);

function main(){
  var compiled = compiler.compileDir('./src');
  fs.writeFileSync(compiledAsmFile, compiled.asm);

  var machine = compiled.machine;
  var intface = new Interface(machine);

  machine.start();
  intface.start();
}