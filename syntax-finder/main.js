'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var finder = require('.');

const SAVE_OUTPUT = 0;

var cwd = __dirname;
var outputFile = path.join(cwd, 'output.txt');

var dirs = [
  O.dirs.node,
  O.dirs.wamp,
];

var exts = [
  'js',
];

setTimeout(main);

function main(){
  var output = finder.find(dirs, exts, func);
  var str = output.join('\n');

  if(SAVE_OUTPUT) fs.writeFileSync(outputFile, str);
  else log(str);
}

function func(src){
  var lines = O.sanl(src);

  var index = lines.findIndex(line => {
    return line.includes(`minifie${'r'}`);
  });

  return index + 1;
}