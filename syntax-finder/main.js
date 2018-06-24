'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var finder = require('.');

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

  fs.writeFileSync(outputFile, str);
}

function func(src){
  var lines = O.sanl(src);

  var index = lines.findIndex(line => {
    return line.includes(`console.log`);
  });

  return index + 1;
}