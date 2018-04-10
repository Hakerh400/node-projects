'use strict';

var fs = require('fs');
var O = require('../framework');
var assembler = require('.');
var Timer = require('./timer.js');
var Interface = require('./interface.js');

var srcFile = './src/src.txt';

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile);
  var machine = new assembler.Machine();

  var timer = new Timer(machine);
  var intface = new Interface(machine);

  machine.compile(src);
  machine.start(src);

  intface.start();
  timer.start();
}