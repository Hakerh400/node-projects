'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const debug = require('../debug');

class Serializable extends O.Stringifiable{
  ser(ser){ O.virtual('ser'); }
  static deser(deser, args){ O.virtual('ser'); }

  serialize(){
    return new Serializer().ser(this);
  }

  static deserialize(bits, argsNum, args){
    return new Deserializer(bits).deser(new Tuple(this, argsNum, args));
  }
}

class Serializer{
  #stack = [];
  #bits = [''];

  ser(obj){
    const stack = this.#stack;

    stack.push(obj);

    while(stack.length !== 0){
      const obj = stack.pop();
      const elems = obj.ser(this);
      if(!elems) continue;

      for(let i = elems.length - 1; i !== -1; i--)
        stack.push(elems[i]);
    }

    return this.getBits();
  }

  getBits(){
    const bits = this.#bits;

    while(bits.length !== 1){
      const str = bits.pop();
      bits[bits.length - 1] += inc(str);
    }

    return trim(inc(bits[0]), 0);
  }

  bit(bit, f=0){
    const bits = this.#bits;

    if(f || this.#stack.length !== 0){
      bits[bits.length - 1] += bit ? 1 : 0;
    }else{
      if(bit) bits.push('');
    }
  }

  bits(bits, f){
    if(bits.length === 0) return;

    const len1 = bits.length - 1;

    for(let i = 0; i !== len1; i++)
      this.bit(bits[i], 1);

    this.bit(bits[len1], f);
  }

  intBit(m, n){
    m = BigInt(m);
    n = BigInt(n);

    for(let i = 0n; i !== m; i++){
      this.bit(n & 1n, 1);
      n >>= 1n;
    }
  }

  intMax(m, n){
    m = BigInt(m);
    n = BigInt(n);

    const a = log2(m);
    const b = 1n << a;
    const c = m - b;

    this.intBit(a, n);

    if(n < c || n >= b)
      this.bit(n >= b, 1);
  }
}

class Deserializer{
  #stack = [];
  #bits;

  constructor(bits){
    this.#bits = dec(bits + '1');
  }

  deser(entry){
    const stack = this.#stack;

    stack.push(entry);

    while(stack.length !== 0){
      const obj = O.last(stack);
      const {ctor, argsNum, args} = obj;

      if(args.length === argsNum){
        assert.fail();
        stack.pop();
        continue;
      }

      if(args.length === argsNum - 1)
        stack.pop();

      const objNew = ctor.deser(this, args);
      args.push(objNew);

      if(objNew instanceof Tuple)
        stack.push(objNew);
    }

    {
      const map = new Map();

      entry.bottomUp(obj => {
        if(obj instanceof Wrapper){
          map.set(obj, obj.val);
          return;
        }

        if(obj instanceof Literal){
          map.set(obj, obj);
          return;
        }

        if(obj instanceof Tuple){
          map.set(obj, new obj.ctor(...obj.args.map(a => {
            assert(map.has(a));

            const b = map.get(a);
            assert(b);

            return b;
          })));
          return;
        }

        assert.fail(obj.constructor.name);
      });

      return map.get(entry);
    }
  }

  bit(f=0){
    const bits = this.#bits;
    let bit;

    if(f || this.#stack.length !== 0){
      bit = bits.length !== 0 ? bits[0] | 0 : 0;
      this.#bits = bits.slice(1);
    }else{
      if(bits.length !== 0){
        bit = 1;
        this.#bits = dec(bits);
      }else{
        bit = 0;
      }
    }

    return bit;
  }

  bits(len, f=0){
    const bits = [];

    if(len === 0) return bits;

    for(let i = 0; i !== len - 1; i++)
      bits.push(this.bit(1));

    bits.push(this.bit(f));

    return bits;
  }

  intBit(m){
    m = BigInt(m);

    let n = 0n;

    for(let i = 0n; i !== m; i++)
      if(this.bit(1))
        n |= 1n << i;

    return n;
  }

  intMax(m){
    m = BigInt(m);

    const a = log2(m);
    const b = 1n << a;
    const c = m - b;

    let n = this.intBit(a);

    if((n < c || n >= b) && this.bit(1))
      n += b;

    return n;
  }
}

class Object extends Serializable{}

class Tuple extends Object{
  constructor(ctor, argsNum, args=[]){
    super();

    this.ctor = ctor;
    this.argsNum = argsNum;
    this.args = args;
  }

  get chNum(){
    assert(this.argsNum === this.args.length);
    return this.argsNum;
  }

  getCh(i){ return this.args[i]; }
}

class Literal extends Object{
  get chNum(){ return 0; }
}

class Wrapper extends Object{
  constructor(val){
    super();

    this.val = val;
  }

  get chNum(){ return 0; }
}

const inc = str => {
  const len = str.length;

  let index = 0;
  while(index !== len && str[index] === '1') index++;

  if(index === len) return '0'.repeat(len) + '1';
  return trim('0'.repeat(index) + '1' + str.slice(index + 1));
};

const dec = str => {
  const len = str.length;

  let index = 0;
  while(index !== len && str[index] === '0') index++;

  assert(index !== len);
  return trim('1'.repeat(index) + '0' + str.slice(index + 1));
};

const trim = (str, includeLast=1) => {
  let index = str.length;
  while(str[--index] === '0');
  return str.slice(0, index + includeLast);
};

const log2 = n => {
  let a = 0n;
  let b = 0n;

  n--;

  while(n){
    a++;
    if(!(n & 1n)) b = 1n;
    n >>= 1n;
  }

  return a - b;
};

module.exports = {
  inc,
  dec,

  Serializer,
  Deserializer,
  Serializable,

  Object,
  Tuple,
  Literal,
  Wrapper,
};