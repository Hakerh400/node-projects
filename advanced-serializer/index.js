  'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Queue = require('./queue');

const inc = str => {
  const len = str.length;

  let index = 0;
  while(index !== len && str[index] === '1') index++;

  if(index === len) return '0'.repeat(len) + '1';
  return '0'.repeat(index) + '1' + str.slice(index + 1);
};

const dec = str => {
  const len = str.length;

  let index = 0;
  while(index !== len && str[index] === '0') index++;

  assert(index !== len);
  return '1'.repeat(index) + '0' + str.slice(index + 1);
};

class Serializer{
  #queue = new Queue();
  #bits = [''];

  ser(obj){
    const queue = this.#queue;

    queue.push(obj);

    while(queue.length !== 0){
      const obj = queue.pop();
      obj.ser(this);
    }

    return this.getBits();
  }

  push(obj){
    this.#queue.push(obj);
  }

  getBits(){
    const bits = this.#bits;

    while(bits.length !== 1){
      const str = bits.pop();
      bits[bits.length - 1] += inc(str);
    }

    const str = inc(bits[0]);

    let index = str.length;
    while(str[--index] === '0');

    return str.slice(0, index);
  }

  bit(bit, force=0){
    const bits = this.#bits;

    if(this.#queue.length === 0){
      if(bit || force) bits.push('');
    }else{
      bits[bits.length - 1] += bit;
    }
  }

  bits(bits){
    if(bits.length === 0) return;

    const len1 = bits.length - 1;

    for(let i = 0; i !== len1; i++)
      this.bit(bits[i], 1);

    this.bit(bits[len1]);
  }
}

class Deserializer{
  
}

class Serializable extends O.Stringifiable{
  ser(ser){ O.virtual('ser'); }
}

module.exports = {
  inc,
  dec,

  Serializer,
  Deserializer,
  Serializable,
};