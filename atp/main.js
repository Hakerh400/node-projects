'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const atp = require('.');

const cwd = __dirname;
const outputFile = path.join(cwd, 'output.txt');

const exprs = atp.expressions;

setTimeout(main);

function main(){
  var output = getOutput();
  fs.writeFileSync(outputFile, output);
}

function getOutput(){
  var {Expression, Constant, Variable} = exprs;

  var ctors = [
    Constant,
    Variable,

    Negation,
    Addition,
    Subtraction,
    Multiplication,
    Exponentiation,
  ];

  var a = new Constant(0);
  var b = new Constant(1);
  var c = new Constant(2);

  var op;

  op = '(((A*b)+(c*D)*e))';
  var op1 = Expression.parse(ctors, op);

  return [
    op1,
  ].map(a => String(a)).join('\n');
}

class Negation extends exprs.UnaryExpression{
  constructor(opnd){
    super(opnd);
  }

  op(){ return '-'; }
  priority(){ return 3; }
  group(){ return 1; }
};

class Addition extends exprs.BinaryExpression{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){ return '+'; }
  priority(){ return 0; }
  group(){ return 0; }
};

class Subtraction extends exprs.BinaryExpression{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){ return '-'; }
  priority(){ return 0; }
  group(){ return 0; }
};

class Multiplication extends exprs.BinaryExpression{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){ return '*'; }
  priority(){ return 1; }
  group(){ return 0; }
};

class Exponentiation extends exprs.BinaryExpression{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){ return '**'; }
  priority(){ return 2; }
  group(){ return 1; }
};