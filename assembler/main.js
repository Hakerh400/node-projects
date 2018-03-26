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

  var angle = O.randf(O.pi2) - O.pi;
  var radius = O.randf(10);

  var x = Math.cos(angle) * radius;
  var y = Math.sin(angle) * radius;

  machine.writef(x, 0);
  machine.writef(y, 1);

  machine.afterOut = (val, port) => {
    if(port === 1){
      finished = true;

      console.log(angle);
      console.log(radius);

      console.log('');

      console.log(machine.readf(0));
      console.log(machine.readf(1));
    }
  };

  var finished = false;
  while(!finished)
    machine.tick();
}