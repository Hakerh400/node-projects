'use strict';

var O = require('../framework');

const CHAR_CODE_BASE = 'A'.charCodeAt(0);
const SPACE = 1;

class Expression{
  constructor(opnds){
    this.opnds = opnds;
  }

  clone(){
    var ctor = this.constructor;
    var opnds = this.opnds.map(opnd => opnd.clone());
    var expr = new ctor(...opnds);

    return expr;
  }
};

class Identifier extends Expression{
  constructor(id){
    super([]);
    this.id = id;
  }

  clone(){
    return new Identifier(this.id);
  }

  toString(){
    return String.fromCharCode(CHAR_CODE_BASE + this.id);
  }
};

class UnaryExpression extends Expression{
  constructor(opnd){
    super([opnd]);
  }

  toString(){
    return this.op() + this.opnds[0].toString(1);
  }
};

class BinaryExpression extends Expression{
  constructor(opnd1, opnd2){
    super([opnd1, opnd2]);
  }

  toString(parens){
    var {opnds} = this;

    var s1 = opnds[0].toString(1);
    var s2 = opnds[1].toString(1);
    var op = this.op();
    var str;

    if(SPACE) str = `${s1} ${op} ${s2}`;
    else str = `${s1}${op}${s2}`;
    if(parens) str = `(${str})`;

    return str;
  }
};

module.exports = {
  Expression,
  Identifier,
  UnaryExpression,
  BinaryExpression,
};