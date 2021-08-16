'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Base = require('./base');

class Expr extends Base{
  refsNum = 0;
  ident = null;

  incRefs(){
    if(this.allowRefs)
      this.refsNum++;

    return this;
  }

  get allowRefs(){ return 1; }

  constructor(type){
    super();
    this.type = type;
  }

  *iterExprs1(){}

  *iterExprs(){
    yield [[this, 'iterExprs1']];
    yield O.yield(this);
  }

  *checkType(type){
    return O.tco([this.type, 'eq'], type);
  }

  solve(csp){
    return this.type.solve(csp, this);
  }

  *toStr1(){ O.virtual('toStr1'); }

  *toStr(deref=1){
    const {ident} = this;

    if(!deref || ident === null)
      return O.tco([this, 'toStr1']);

    return ident;
  }
}

class Literal extends Expr{
  constructor(type, val=null){
    super(type);
    this.val = val;
  }
}

class BitVec extends Literal{
  constructor(size, val){
    assert(typeof val == 'bigint');
    super(new Type.BitVec(size), val);
    this.size = size;
  }

  *toStr1(){
    const {size, val} = this;
    assert(val !== null);

    return `(_ bv${val} ${size})`;
  }
}

class Call extends Expr{
  constructor(type, func, args=[]){
    assert(typeof func === 'string');

    super(type);
    this.func = func;
    this.args = args;

    for(const arg of args)
      arg.incRefs();
  }

  *iterExprs1(){
    for(const arg of this.args)
      yield [[arg, 'iterExprs']];
  }

  *toStr1(){
    const {func, args} = this;
    return O.tco(list2str, [func, ...args]);
  }
}

class Const extends Call{
  constructor(type, name){
    super(type, name);
  }

  get allowRefs(){ return 0; }
}

class Def extends Expr{
  constructor(expr){
    super(expr.type);
    this.expr = expr;
  }

  get allowRefs(){ return 0; }

  *toStr1(){
    return O.tco([this.expr, 'toStr1']);
  }
}

class Ref extends Expr{
  constructor(type, name){
    super(type);
    this.name = name;
  }

  get allowRefs(){ return 0; }

  *toStr1(){
    return this.name;
  }
}

class Extract extends Expr{
  constructor(expr, start, size){
    assert(typeof start === 'number');
    assert(typeof size === 'number');
    assert(start >= 0);
    assert(size >= 0);
    assert(start + size <= expr.type.size);

    super(new Type.BitVec(size));
    this.expr = expr.incRefs();
    this.start = start;
    this.size = size;
  }

  *toStr1(){
    const {expr, start, size} = this;

    return `((_ extract ${start + size - 1} ${start}) ${
      yield [[expr, 'toStr']]})`
  }
}

const list2str = function*(arr){
  const len = arr.length;
  assert(len !== 0);

  const arrNew = [];

  for(const elem of arr)
    arrNew.push(yield [toStr, elem]);

  if(len === 1)
    return arrNew[0];

  return `(${arrNew.join(' ')})`;
};

const toStr = function*(elem){
  if(elem instanceof Base)
    return O.tco([elem, 'toStr']);

  return String(elem);
};

module.exports = Object.assign(Expr, {
  Literal,
  BitVec,
  Call,
  Const,
  Def,
  Ref,
  Extract,
});

const Type = require('./type');

const {bool} = Type;
const True = new Const(bool, 'true');
const False = new Const(bool, 'false');
const b0 = new BitVec(1, 0n);
const b1 = new BitVec(1, 1n);

Object.assign(Expr, {
  True,
  False,
  b0,
  b1,
});