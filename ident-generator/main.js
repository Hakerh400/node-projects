'use strict';

var fs = require('fs');
var O = require('../framework');
var identGenerator = require('.');

setTimeout(main);

function main(){
  fs.writeFileSync('1.txt', (() => {
    return O.ca(1e3, i => {
      return identGenerator.generate(i + 1);
    }).join`\n`;
  })());
}