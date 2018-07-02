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
  var a = new exprs.Identifier(0);
  var b = new exprs.Identifier(1);
  var c = new exprs.Identifier(2);

  var op;

  op = new Addition(a, b);
  var op1 = new Addition(op, c);

  op = new Addition(b, c);
  var op2 = new Addition(a, op);

  op = new Exponentiation(a, b);
  var op3 = new Exponentiation(op, c);

  op = new Exponentiation(b, c);
  var op4 = new Exponentiation(a, op);

  return [
    op1,
    op2,
    op3,
    op4,
  ].join('\n');
}

class Negation extends exprs.UnaryExpression{
  constructor(opnd){
    super(opnd);
  }

  op(){ return '-'; }
  priority(){ return 3; }
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