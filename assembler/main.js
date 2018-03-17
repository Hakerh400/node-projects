'use strict';

var fs = require('fs');
var assembler = require('.');

var srcFile = './src.txt';

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile);
  var machine = new assembler.Machine();

  machine.compile(src);

  machine.write(5);
  machine.write(7);

  do{
    var byte = machine.read();
    if(byte === null) continue;

    console.log(byte);

    break;
  }while(1);
}