'use strict';

var fs = require('fs');
var O = require('../framework');
var assembler = require('.');

var srcFile = './src.txt';
var memFile = './mem.hex';

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile);
  var machine = new assembler.Machine();

  machine.compile(src);
  fs.writeFileSync(memFile, machine.mem.buff);

  machine.afterOut = (val, port) => {
    finished = true;
    console.log(val);
  };

  var finished = false;
  while(!finished)
    machine.tick();
}