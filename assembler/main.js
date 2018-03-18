'use strict';

var fs = require('fs');
var assembler = require('.');

var srcFile = './src.txt';
var memFile = './mem.hex';

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile);
  var machine = new assembler.Machine();

  machine.compile(src);
  fs.writeFileSync(memFile, machine.mem.buff);

  var output = machine.exec('ABCDE');
  console.log(Buffer.from(output).toString());
}