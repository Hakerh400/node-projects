'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var nterms = require('./nterms.js');
var Syntax = require('.');

var cwd = __dirname;
var inputFile = path.join(cwd, 'input.txt');
var outputFile = path.join(cwd, 'output.json');

setTimeout(main);

function main(){
  var input = fs.readFileSync(inputFile, 'utf8');
  var syntax = new Syntax(input, nterms);
  
  syntax.parse().then(parsed => {
    var output = parsed.toString();
    fs.writeFileSync(outputFile, output);
  }).catch(err => {
    log(err);
  });
}