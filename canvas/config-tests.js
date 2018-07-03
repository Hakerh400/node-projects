'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');

const cwd = __dirname;
const file = path.join(cwd, 'node_modules/canvas/package.json');

setTimeout(main);

function main(){
  var str = fs.readFileSync(file, 'utf8');
  str = configTest(str);
  fs.writeFileSync(file, str);
}

function configTest(str){
  var obj = JSON.parse(str);

  obj.scripts.pretest = "echo.";

  return JSON.stringify(obj, null, 2);
}