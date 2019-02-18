'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const INT_SIZE = 8;
const INT_MASK = (1 << INT_SIZE) - 1 | 0;
const HIGHEST_BIT = 1 << INT_SIZE - 1;

class Address{
  constructor(val=0){
    this.ints = [];

    this.set(val);
  }

  static intSize(){ return INT_SIZE; }
  static from(addr){ return new Address().from(addr); }

  static oldOrNew(addr, createNew){
    if(createNew) return addr.clone();
    return addr;
  }

  static zero(createNew=0){ return Address.oldOrNew(zero, createNew); }
  static one(createNew=0){ return Address.oldOrNew(one, createNew); }

  len(){ return this.ints.length; }
  reset(val=0){ return this.set(val); }

  from(addr){ return this.reset().add(addr); }
  copy(addr){ return addr.from(this); }
  clone(){ return Address.from(this); }

  set(val=0){
    const {ints} = this;

    ints.length = 0;

    while(val !== 0){
      ints.push(val & INT_MASK);
      val >>>= INT_SIZE;
    }

    return this;
  }

  adapt(addr){
    const {ints} = this;
    const ints1 = addr.ints
    const len = ints.length;
    const len1 = ints1.length;
    if(len >= len1) return;

    let dif = len1 - len;
    for(let i = 0; i !== dif; i++)
      ints.push(0);

    return this;
  }

  cmp(addr){
    this.adapt(addr);

    const {ints} = this;
    const ints1 = addr.ints
    const len = ints.length;
    const len1 = ints1.length;

    if(len !== 0){
      for(let i = len - 1; ; i--){
        const val = ints[i];
        const val1 = i < len1 ? ints1[i] : 0;
        if(val < val1) return 0;
        if(val > val1) return 1;
        if(i === 0) break;
      }
    }

    return 1;
  }

  eq(addr){ return this.cmp(addr) === 1; }
  neq(addr){ return this.cmp(addr) !== 1; }
  lt(addr){ return this.cmp(addr) === 0; }
  lte(addr){ return this.cmp(addr) !== 2; }
  gt(addr){ return this.cmp(addr) === 2; }
  gte(addr){ return this.cmp(addr) !== 0; }

  inc(){
    const {ints} = this;
    const len = ints.length;
    let bit = 1;

    for(let i = 0; i !== len; i++){
      const val = ints[i] + bit;
      bit = val > INT_MASK ? 1 : 0;
      ints[i] = val & INT_MASK;
      if(!bit) break;
    }

    if(bit) ints.push(1);
    return this;
  }

  shl(n=1){
    const {ints} = this;

    while(n !== 0){
      n--;

      const len = ints.length;
      let bit = 0;

      for(let i = 0; i !== len; i++){
        const v = ints[i];
        const val = (v << 1) | bit;
        bit = v & HIGHEST_BIT ? 1 : 0;
        ints[i] = val & INT_MASK;
      }

      if(bit) ints.push(1);
    }

    return this;
  }

  shr(n=1){
    const {ints} = this;

    while(n !== 0){
      n--;

      const len = ints.length;
      let bit = 0;

      if(len === 0) break;

      for(let i = len - 1; ; i--){
        const v = ints[i];
        const val = (v >>> 1) | (bit ? HIGHEST_BIT : 0);
        bit = v & 1;
        ints[i] = val;
        if(i === 0) break;
      }
    }

    return this;
  }

  dec(){
    const {ints} = this;
    const len = ints.length;
    let bit = 1;

    for(let i = 0; i !== len; i++){
      const val = ints[i] - bit;
      bit = val < 0 ? 1 : 0;
      ints[i] = val & INT_MASK;
      if(!bit) break;
    }

    if(bit) this.errNeg();
    return this;
  }

  add(addr){
    this.adapt(addr);

    const {ints} = this;
    const ints1 = addr.ints
    const len = ints.length;
    const len1 = ints1.length;
    let bit = 0;

    for(let i = 0; i !== len; i++){
      const val1 = i < len1 ? ints1[i] : 0;
      const val = ints[i] + val1 + bit;
      bit = val > INT_MASK ? 1 : 0;
      ints[i] = val & INT_MASK;
    }

    if(bit) ints.push(1);
    return this;
  }

  sub(addr){
    this.adapt(addr);

    const {ints} = this;
    const ints1 = addr.ints
    const len = ints.length;
    const len1 = ints1.length;
    let bit = 0;

    for(let i = 0; i !== len; i++){
      const val1 = i < len1 ? ints1[i] : 0;
      const val = ints[i] - val1 - bit;
      bit = val < 0 ? 1 : 0;
      ints[i] = val & INT_MASK;
    }

    if(bit) this.errNeg();
    return this;
  }

  lowestBits(n){
    const {ints} = this;
    const len = ints.length;

    const i = n / INT_SIZE | 0;
    const j = n % INT_SIZE | 0;

    if(i < len){
      ints[i] &= (1 << j) - 1;
      ints.length = i + 1;
    }

    return this;
  }

  normalize(){
    const {ints} = this;
    let len = ints.length;

    while(len !== 0 && ints[len - 1] === 0)
      len--;

    ints.length = len;
    return this;
  }

  valueOf(){
    const {ints} = this;
    const len = ints.length;
    let val = 0;

    if(len !== 0){
      for(let i = len - 1; ; i--){
        val = (val << 8) | ints[i];
        if(i === 0) break;
      }
    }

    return val;
  }

  errNeg(){
    throw new TypeError('Negative address');
  }
};

const zero = new Address(0);
const one = new Address(1);

module.exports = Address;