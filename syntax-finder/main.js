'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const finder = require('.');
const skipList = require('./skip-list');

const SAVE_OUTPUT = 0;

const cwd = __dirname;
const outputFile = path.join(cwd, 'output.txt');

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

function func(file, src){
  var dirs = file.split(/[\/\\]/);
  if(dirs.some(dir => skipList.includes(dir))) return;

  var lines = O.sanl(src);

  var index = lines.findIndex(line => {
    return /Math\.(?:random)/.test(line);
  });

  return index + 1;
}