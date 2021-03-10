'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class Base{}

class Expression extends Base{}

class AnyExpression extends Expression{
  static #kCtor = Symbol();
  static anyExpr = new AnyExpression(this.#kCtor);

  constructor(kCtor){
    super();
    assert(kCtor === this.constructor.#kCtor);
  }
}

class NamedExpression extends Expression{
  constructor(name){
    super();
    this.name = name;
  }
}

class Variable extends NamedExpression{}
class Type extends NamedExpression{}

class BinaryExpression extends Expression{
  constructor(fst, snd){
    super();
    this.fst = fst;
    this.snd = snd;
  }
}

class Pair extends BinaryExpression{}
class Call extends BinaryExpression{}
class AsPattern extends Expression{}

class Lhs extends Base{
  constructor(args){
    super();
    this.args = args;
  }

  get argsNum(){ return this.args.length; }
}

class Rhs extends Base{
  constructor(expr){
    super();
    this.expr = expr;
  }

  get result(){ return this.expr; }
}

const {anyExpr} = AnyExpression;

module.exports = {
  Base,
  Expression,
  AnyExpression,
  NamedExpression,
  Variable,
  Type,
  BinaryExpression,
  Pair,
  Call,
  AsPattern,
  Lhs,
  Rhs,

  anyExpr,
};