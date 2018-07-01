'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var atp = require('.');

var cwd = __dirname;
var outputFile = path.join(cwd, 'output.txt');

var exprs = atp.expressions;

setTimeout(main);

function main(){
  var output = getOutput();
  fs.writeFileSync(outputFile, output);
}

function getOutput(){
  var a = new exprs.Identifier(0);
  var b = new exprs.Identifier(1);
  var c = new exprs.Identifier(2);

  var op1 = new Addition(a, b);
  var op2 = new Multiplication(op1, c);

  op2.opnds[1] = op2.clone();

  return op2.toString();
}

class Addition extends exprs.BinaryExpression{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){
    return '+';
  }
};

class Multiplication extends exprs.BinaryExpression{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){
    return '*';
  }
};