'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const INT_SIZE = 8;
const INT_MASK = (1 << INT_SIZE) - 1 | 0;
const HIGHEST_BIT = 1 << INT_SIZE - 1;

class Address{
  constructor(val=0){
    this.arr = [];

    // This is used for building address from bits
    this.index = 0;
    this.mask = 1;

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

  len(){ return this.arr.length; }
  fromArr(arr){ this.arr = arr.slice(); return this; }
  from(addr){ return this.fromArr(addr.arr); }
  copy(addr){ return addr.from(this); }
  clone(){ return Address.from(this); }

  prepare(){
    this.arr.length = 0;
    this.arr.push(0);

    this.index = 0;
    this.mask = 1;

    return this;
  }

  push(bit){
    if(bit) this.arr[this.index] |= this.mask;

    if(this.mask !== HIGHEST_BIT){
      this.mask <<= 1;
    }else{
      this.arr.push(0);
      this.mask = 1;
      this.index++;
    }

    return this;
  }

  set(val=0){
    const {arr} = this;

    arr.length = 0;

    while(val !== 0){
      arr.push(val & INT_MASK);
      val >>>= INT_SIZE;
    }

    return this;
  }

  adapt(addr){
    const {arr} = this;
    const arr1 = addr.arr
    const len = arr.length;
    const len1 = arr1.length;

    if(len < len1){
      let dif = len1 - len;
      for(let i = 0; i !== dif; i++)
        arr.push(0);
    }

    return this;
  }

  cmp(addr){
    this.adapt(addr);

    const {arr} = this;
    const arr1 = addr.arr
    const len = arr.length;
    const len1 = arr1.length;

    if(len !== 0){
      for(let i = len - 1; ; i--){
        const val = arr[i];
        const val1 = i < len1 ? arr1[i] : 0;
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

  shl(n=1){
    const {arr} = this;

    while(n-- !== 0){
      const len = arr.length;
      let bit = 0;

      for(let i = 0; i !== len; i++){
        const v = arr[i];
        const val = (v << 1) | bit;
        bit = v & HIGHEST_BIT ? 1 : 0;
        arr[i] = val & INT_MASK;
      }

      if(bit) arr.push(1);
    }

    return this;
  }

  shr(n=1){
    const {arr} = this;

    while(n-- !== 0){
      const len = arr.length;
      let bit = 0;

      if(len === 0) break;

      for(let i = len - 1; ; i--){
        const v = arr[i];
        const val = (v >>> 1) | (bit ? HIGHEST_BIT : 0);
        bit = v & 1;
        arr[i] = val;
        if(i === 0) break;
      }
    }

    return this;
  }

  inc(){
    const {arr} = this;
    const len = arr.length;
    let bit = 1;

    for(let i = 0; i !== len; i++){
      const val = arr[i] + bit;
      bit = val > INT_MASK ? 1 : 0;
      arr[i] = val & INT_MASK;
      if(!bit) break;
    }

    if(bit) arr.push(1);
    return this;
  }

  dec(){
    const {arr} = this;
    const len = arr.length;
    let bit = 1;

    for(let i = 0; i !== len; i++){
      const val = arr[i] - bit;
      bit = val < 0 ? 1 : 0;
      arr[i] = val & INT_MASK;
      if(!bit) break;
    }

    if(bit) this.errNeg();
    return this;
  }

  add(addr){
    this.adapt(addr);

    const {arr} = this;
    const arr1 = addr.arr
    const len = arr.length;
    const len1 = arr1.length;
    let bit = 0;

    for(let i = 0; i !== len; i++){
      const val1 = i < len1 ? arr1[i] : 0;
      const val = arr[i] + val1 + bit;
      bit = val > INT_MASK ? 1 : 0;
      arr[i] = val & INT_MASK;
    }

    if(bit) arr.push(1);
    return this;
  }

  sub(addr){
    this.adapt(addr);

    const {arr} = this;
    const arr1 = addr.arr
    const len = arr.length;
    const len1 = arr1.length;
    let bit = 0;

    for(let i = 0; i !== len; i++){
      const val1 = i < len1 ? arr1[i] : 0;
      const val = arr[i] - val1 - bit;
      bit = val < 0 ? 1 : 0;
      arr[i] = val & INT_MASK;
    }

    if(bit) this.errNeg();
    return this;
  }

  lowestBits(n){
    const {arr} = this;
    const len = arr.length;

    const i = n / INT_SIZE | 0;
    const j = n % INT_SIZE | 0;

    if(i < len){
      arr[i] &= (1 << j) - 1;
      arr.length = i + 1;
    }

    return this;
  }

  normalize(){
    const {arr} = this;
    let len = arr.length;

    while(len !== 0 && arr[len - 1] === 0)
      len--;

    arr.length = len;
    return this;
  }

  valueOf(){
    const {arr} = this;
    const len = arr.length;
    let val = 0;

    if(len !== 0){
      for(let i = len - 1; ; i--){
        val = (val << INT_SIZE) | arr[i];
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