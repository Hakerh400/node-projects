'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var obfuscator = require('.');

const EXECUTE = 0;
const ALIGN = 1;

var cwd = __dirname;
var inputFile = path.join(cwd, 'input.txt');
var outputFile = path.join(cwd, 'output.js');

setTimeout(main);

function main(){
  var input = fs.readFileSync(inputFile, 'utf8');
  var output = obfuscator.obfuscate(input);

  if(ALIGN){
    while(1){
      var lines = O.sanl(output);
      lines.pop();

      if(lines.every(a => a.length === 80))
        break;

      output = obfuscator.obfuscate(input);
    }
  }

  fs.writeFileSync(outputFile, output);

  if(EXECUTE){
    var func = new Function(output);
    func();
  }
}