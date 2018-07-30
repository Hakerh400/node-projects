'use strict';

const fs = require('fs');
const O = require('../framework');
const functional = require('.');
const IO = require('./io');

setTimeout(main);

function main(){
  var src = fs.readFileSync('src.txt', 'ascii');
  var machine = new functional.Machine(src);

  var input = '';

  var io = new IO(machine, input);
  var tick = machine.start();

  while(!tick.next().done);

  var output = io.getOutput();
  log(output);
}