'use strict';

var fs = require('fs');
var diskEditor = require('.');

setTimeout(main);

function main(){
  var data = diskEditor.read(0);
  fs.writeFileSync('C:/Users/Thomas/Downloads/1.hex');
}