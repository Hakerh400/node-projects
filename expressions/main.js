'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var exprs = require('.');

var cwd = __dirname;
var outputFile = path.join(cwd, 'output.txt');

setTimeout(main);

function main(){
  var expr = exprs.genExpr(3);
  var output = expr.toString();

  fs.writeFileSync(outputFile, output);
}