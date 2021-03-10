'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class Base{}

class Program extends Base{
  types = O.obj();
  funcs = O.obj();

  sanitize(){


    return this;
  }

  hasType(sym){
    return O.has(this.types, sym);
  }

  hasFunc(sym){
    return O.has(this.funcs, sym);
  }

  hasSym(sym){
    return this.hasType(sym) || this.hasFunc(sym);
  }

  addType(sym){
    assert(!this.hasSym(sym));
    this.types[sym] = 1;
  }

  addFunc(sym, func){
    assert(!this.hasSym(sym));
    this.funcs[sym] = func;
  }

  getFunc(sym){
    assert(this.hasFunc(sym));
    return this.funcs[sym];
  }

  addCase(sym, fcase){
    this.getFunc(sym).addCase(fcase);
  }

  getCases(sym){
    return this.getFunc(sym).cases;
  }

  casesNum(sym){
    return this.getCases(sym).length;
  }

  hasCases(sym){
    return this.casesNum(sym) !== 0;
  }
}

class Function extends Base{
  constructor(sym, type=null, cases=[]){
    super();
    this.sym = sym;
    this.type = type;
    this.cases = cases;
  }

  addCase(fcase){
    this.cases.push(fcase);
  }
}

class FunctionCase extends Base{
  constructor(lhs, rhs){
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }
}

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
    assert(typeof name === 'symbol');
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

class AsPattern extends Expression{
  constructor(exprs){
    super();
    this.exprs = exprs;
  }
}

const {anyExpr} = AnyExpression;

module.exports = {
  Base,
  Program,
  Function,
  FunctionCase,
  Lhs,
  Rhs,
  Expression,
  AnyExpression,
  NamedExpression,
  Variable,
  Type,
  BinaryExpression,
  Pair,
  Call,
  AsPattern,

  anyExpr,
};