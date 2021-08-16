'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Base = require('./base');

class Type extends Base{
  constructor(size){
    super();
    this.size = size;
  }

  get baseCtor(){ return this.ctor; }
  *eq1(){ O.virtual('eq1'); }

  *eq(type1){
    if(this.baseCtor !== type.baseCtor) return 0;
    return O.tco([this, 'eq1'], type);
  }

  async solve(csp, expr){ O.virtual('solve'); }

  isBool(){ return 0; }
  isBv(){ return 0; }
  isArr(){ return 0; }
}

class Bool extends Type{
  constructor(){
    super(1);
  }

  *eq(type){
    return 1;
  }

  isBool(){ return 1; }

  async solve(csp, expr){
    const vals = [Expr.False, Expr.True];
    let index = O.rand(2);

    const k = csp.assert(csp.eq(expr, vals[index]));

    if(!await csp.check(1))
      csp.assert(csp.eq(expr, vals[index ^= 1]), k);

    return index === 1;
  }

  *toStr(){
    return 'Bool';
  }
}

class BitVec extends Type{
  *eq(type){
    return this.size === type.size;
  }

  isBv(){ return 1; }

  async solve(csp, expr){
    const {size} = this;
    const {b0, b1} = Expr;
    const bs = [b0, b1];
    const indices = [];

    let n = 0n;

    for(const i of O.shuffle(O.ca(size, i => i))){
      let bit = O.rand(2);

      const k = csp.assert(csp.eq(csp.bvext(expr, i, 1), bs[bit]));

      if(!await csp.check(1))
        csp.assert(csp.eq(csp.bvext(expr, i, 1), bs[bit ^= 1]), k);

      indices.push(k);
      n |= BigInt(bit) << BigInt(i);
    }

    for(let i = size - 1; i !== -1; i--)
      csp.undo(indices[i]);

    csp.assert(csp.eq(expr, csp.bv(size, n)));

    return n;
  }

  *toStr(){
    return `(_ BitVec ${this.size})`;
  }
}

class Array extends BitVec{
  constructor(bvSize, len){
    super(bvSize * len);
    this.bvSize = bvSize;
    this.len = len;
  }

  isArr(){ return 1; }

  get baseCtor(){ return BitVec; }
}

module.exports = Object.assign(Type, {
  Bool,
  BitVec,
  Array,
});

const Expr = require('./expr');

const bool = new Bool();

Object.assign(Type, {
  bool,
});