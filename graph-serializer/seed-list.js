'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const hash = require('../hash');

class SeedList{
  constructor(seed){
    if(!(typeof seed === 'string' || Buffer.isBuffer(seed)))
      seed = String(seed);

    this.h = Buffer.from(seed);
    this.arr = [];

    this.hash();
  }

  hash(str=''){
    this.h = hash(this.h.toString('hex') + str);
    return this.h.readUInt32LE(0);
  }

  random(){
    return this.hash() / 2 ** 32;
  }

  rand(a){
    return this.random() * a | 0;
  }

  add(elem){
    this.hash('add');
    this.arr.push(elem);
  }

  next(){
    if(this.isEmpty()) return null;
    this.hash('next');
    var index = this.rand(this.arr.length);
    return this.arr.splice(index, 1)[0];
  }

  hasMore(){ return this.arr.length !== 0; }
  isEmpty(){ return this.arr.length === 0; }
}

module.exports = SeedList;