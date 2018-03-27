'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var compiler = require('.');

var srcDir = './src';
var compiledDir = './compiled';
var compiledAsmFile = path.join(compiledDir, 'asm.txt');
var compiledHexFile = path.join(compiledDir, 'hex.hex');

setTimeout(main);

function main(){
  var compiled = compiler.compileDir('./src');

  fs.writeFileSync(compiledAsmFile, compiled.asm);
  fs.writeFileSync(compiledHexFile, compiled.hex);
}