'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const INT_SIZE = 8;
const INT_MASK = (1 << INT_SIZE) - 1 | 0;
const HIGHEST_BIT = 1 << INT_SIZE - 1;

class BigInt{
  constructor(val=0){
    this.arr = [];

    // This is used for building BigInt from bits
    this.index = 0;
    this.mask = 1;

    this.set(val);
  }

  static intSize(){ return INT_SIZE; }
  static from(bi){ return new BigInt().from(bi); }

  static oldOrNew(bi, createNew){
    if(createNew) return bi.clone();
    return bi;
  }

  static zero(createNew=0){ return BigInt.oldOrNew(zero, createNew); }
  static one(createNew=0){ return BigInt.oldOrNew(one, createNew); }

  len(){ return this.arr.length; }
  fromArr(arr){ this.arr = arr.slice(); return this; }
  from(bi){ return this.fromArr(bi.arr); }
  copy(bi){ return bi.from(this); }
  clone(){ return BigInt.from(this); }

  prepare(){
    this.arr.length = 0;
    this.index = 0;
    this.mask = 1;
    return this;
  }

  push(bit){
    if(this.mask === 1) this.arr.push(0);
    if(bit) this.arr[this.index] |= this.mask;

    if(this.mask !== HIGHEST_BIT){
      this.mask <<= 1;
    }else{
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

  setLen(lenNew){
    const {arr} = this;
    const len = arr.length;

    if(lenNew < len){
      arr.length = len;
    }else{
      const dif = lenNew - len;
      while(dif-- !== 0) arr.push(0);
    }

    return this;
  }

  adapt(bi){
    const {arr} = this;
    const arr1 = bi.arr
    const len = arr.length;
    const len1 = arr1.length;

    if(len < len1){
      let dif = len1 - len;
      while(dif-- !== 0) arr.push(0);
    }else if(len > len1){
      let dif = len - len1;
      while(dif-- !== 0) arr1.push(0);
    }

    return this;
  }

  isZero(){
    const {arr} = this;
    const len = arr.length;

    for(let i = 0; i !== len; i++)
      if(arr[i] !== 0) return 0;

    return 1;
  }

  isPos(){ return !this.highestBit(); }
  isNeg(){ return this.highestBit(); }

  cmp(bi){
    this.adapt(bi);

    const {arr} = this;
    const arr1 = bi.arr
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

  eq(bi){ return this.cmp(bi) === 1; }
  neq(bi){ return this.cmp(bi) !== 1; }
  lt(bi){ return this.cmp(bi) === 0; }
  lte(bi){ return this.cmp(bi) !== 2; }
  gt(bi){ return this.cmp(bi) === 2; }
  gte(bi){ return this.cmp(bi) !== 0; }

  minus(){
    return this.neg().inc();
  }

  neg(){
    const {arr} = this;
    const len = arr.length;

    for(let i = 0; i !== len; i++)
      arr[i] ^= INT_MASK;

    return this;
  }

  and(bi){
    this.adapt(bi);

    const {arr} = this;
    const arr1 = bi.arr;
    const len = arr.length;

    for(let i = 0; i !== len; i++)
      arr[i] &= arr1[i];

    return this;
  }

  or(bi){
    this.adapt(bi);

    const {arr} = this;
    const arr1 = bi.arr;
    const len = arr.length;

    for(let i = 0; i !== len; i++)
      arr[i] |= arr1[i];

    return this;
  }

  xor(bi){
    this.adapt(bi);

    const {arr} = this;
    const arr1 = bi.arr;
    const len = arr.length;

    for(let i = 0; i !== len; i++)
      arr[i] ^= arr1[i];

    return this;
  }

  imp(bi){
    this.adapt(bi);

    const {arr} = this;
    const arr1 = bi.arr;
    const len = arr.length;

    for(let i = 0; i !== len; i++)
      arr[i] = (arr[i] ^ INT_MASK) | arr1[i];

    return this;
  }

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

    return this;
  }

  add(bi){
    this.adapt(bi);

    const {arr} = this;
    const arr1 = bi.arr
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

  sub(bi){
    this.adapt(bi);

    const {arr} = this;
    const arr1 = bi.arr
    const len = arr.length;
    const len1 = arr1.length;
    let bit = 0;

    for(let i = 0; i !== len; i++){
      const val1 = i < len1 ? arr1[i] : 0;
      const val = arr[i] - val1 - bit;
      bit = val < 0 ? 1 : 0;
      arr[i] = val & INT_MASK;
    }

    return this;
  }

  mul(bi){
    const aux1 = this.clone();
    const aux2 = bi.clone();

    this.set(0);

    while(!aux2.isZero()){
      if(aux2.lowestBit())
        this.add(aux1);

      aux1.shl();
      aux2.shr();
    }

    return this;
  }

  lowestBit(){
    const {arr} = this;
    const len = arr.length;

    if(len === 0) return 0;
    return arr[0] & 1;
  }

  highestBit(){
    const {arr} = this;
    const len = arr.length;

    if(len === 0) return 0;
    return arr[len - 1] & HIGHEST_BIT ? 1 : 0;
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

  toJSBigInt(){
    const {arr} = this;
    const len = arr.length;
    let val = i2bi(0);

    if(len !== 0){
      for(let i = len - 1; ; i--){
        val = (val << i2bi(INT_SIZE)) | i2bi(arr[i]);
        if(i === 0) break;
      }
    }

    return val;
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

  toString(){
    return this.toJSBigInt().toString();
  }
}

BigInt.prototype.lbs = BigInt.prototype.lowestBits;

const zero = new BigInt(0);
const one = new BigInt(1);

module.exports = BigInt;

// Convert integer into JavaScript BigInt
function i2bi(val){
  return global.BigInt(val);
}