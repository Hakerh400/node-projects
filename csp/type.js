'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Base = require('./base');

class Type extends Base{
  size = null;

  *eq1(){ O.virtual('eq1'); }

  *eq(type1){
    if(this.ctor !== type.ctor) return 0;
    return O.tco([this, 'eq1'], type);
  }

  async solve(csp, expr){ O.virtual('solve'); }

  isBool(){ return 0; }
  isBv(){ return 0; }
}

class Bool extends Type{
  size = 1;

  *eq(type){
    return 1;
  }

  isBool(){ return 1; }

  async solve(csp, expr){
    const vals = [Expr.False, Expr.True];
    let index = O.rand(2);

    const k = csp.assert(csp.eq(expr, vals[index]));

    if(!await csp.check())
      csp.assert(csp.eq(expr, vals[index ^= 1]), k);

    return index === 1;
  }

  *toStr(){
    return 'Bool';
  }
}

class BitVec extends Type{
  constructor(size){
    super();
    this.size = size;
  }

  *eq(type){
    return this.size === type.size;
  }

  isBv(){ return 1; }

  async solve(csp, expr){
    const {size} = this;
    const {b0, b1} = Expr;
    const bs = [b0, b1];

    let n = 0n;

    for(let i = 0; i !== size; i++){
      let bit = O.rand(2);

      const k = csp.assert(csp.eq(csp.bvext(expr, i, 1), bs[bit]));

      if(!await csp.check())
        csp.assert(csp.eq(csp.bvext(expr, i, 1), bs[bit ^= 1]), k);

      n |= BigInt(bit) << BigInt(i);
    }

    return n;
  }

  *toStr(){
    return `(_ BitVec ${this.size})`;
  }
}

module.exports = Object.assign(Type, {
  Bool,
  BitVec,
});

const Expr = require('./expr');

const bool = new Bool();

Object.assign(Type, {
  bool,
});