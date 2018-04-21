'use strict';

var fs = require('fs');
var path = require('path');

var cwd = __dirname;
var file = path.join(cwd, 'node_modules/canvas/package.json');

setTimeout(main);

function main(){
  var str = fs.readFileSync(file, 'utf8');
  str = str.replace(/standard.*?mocha/, 'mocha');
  fs.writeFileSync(file, str);
}