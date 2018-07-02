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

  var op1 = Expression.parse(ctors, 'a * b');
  var op2 = Expression.parse(ctors, '(P + -b) * -Q * c ** d');
  var op3 = Expression.parse(ctors, 'e * -r * ((F)) ** c');

  var op4 = Expression.combine([[op1, op2], [op1, op3]]);

  return [
    op4,
  ].map(a => String(a)).join('\n');
}

class Negation extends exprs.UnaryOperation{
  constructor(opnd){
    super(opnd);
  }

  op(){ return '-'; }
  priority(){ return 3; }
  group(){ return 1; }
};

class Addition extends exprs.BinaryOperation{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){ return '+'; }
  priority(){ return 0; }
  group(){ return 0; }
};

class Subtraction extends exprs.BinaryOperation{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){ return '-'; }
  priority(){ return 0; }
  group(){ return 0; }
};

class Multiplication extends exprs.BinaryOperation{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){ return '*'; }
  priority(){ return 1; }
  group(){ return 0; }
};

class Exponentiation extends exprs.BinaryOperation{
  constructor(opnd1, opnd2){
    super(opnd1, opnd2);
  }

  op(){ return '**'; }
  priority(){ return 2; }
  group(){ return 1; }
};