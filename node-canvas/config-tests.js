'use strict';

var fs = require('fs');

var file = './node_modules/canvas/package.json';

setTimeout(main);

function main(){
  var str = fs.readFileSync(file).toString();
  str = str.replace(/standard.*?mocha/, 'mocha');
  fs.writeFileSync(file, str);
}