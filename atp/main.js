'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var Atp = require('.');

var cwd = __dirname;
var syntaxFile = path.join(cwd, 'syntax.json');
var rulesFile = path.join(cwd, 'rules.json');
var inputFile = path.join(cwd, 'input.txt');
var outputFile = path.join(cwd, 'output.txt');

setTimeout(main);

function main(){
  var syntax = JSON.parse(fs.readFileSync(syntaxFile, 'utf8'));
  var rules = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
  var input = fs.readFileSync(inputFile, 'utf8');

  var atp = new Atp(syntax, rules);

  var proof = atp.prove(input);
  fs.writeFileSync(outputFile, proof.toString());
}