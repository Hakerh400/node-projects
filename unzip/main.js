'use strict';

var fs = require('fs');
var path = require('path');
var unzip = require('.');

var input = 'input';
var output = 'output';

setTimeout(main);

function main(){
  var cwd = process.cwd();

  input = path.join(cwd, input);
  output = path.join(cwd, output);

  unzip(input, output, err => {
    if(err) return console.log(err);
    console.log('Success.');
  });
}