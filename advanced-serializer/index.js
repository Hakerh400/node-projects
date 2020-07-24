  'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const debug = require('../debug');

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

  bit(bit, force=0){
    const bits = this.#bits;

    if(this.#stack.length !== 0 || force){
      bits[bits.length - 1] += bit;
    }else{
      if(bit) bits.push('');
    }
  }

  bits(bits, force=0){
    if(bits.length === 0) return;

    const len1 = bits.length - 1;

    for(let i = 0; i !== len1; i++)
      this.bit(bits[i], 1);

    this.bit(bits[len1], force);
  }
}

class Deserializer{
  #stack = [];
  #bits = '';

  deser(bits, func){
    this.#bits = dec(bits + '1');

    const stack = this.#stack;
    const entry = new Tuple(Wrapper, 1);

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

      const info = func();
      assert(info.length === 2);

      if(info[0] === null){
        args.push(new Literal(info[1]));
        continue;
      }

      const objNew = new Tuple(info[0], info[1]);

      args.push(objNew);
      stack.push(objNew);
    }

    {
      const map = new Map();

      entry.bottomUp(obj => {
        if(obj instanceof Literal){
          map.set(obj, obj.obj);
          return;
        }

        if(obj instanceof Tuple){
          map.set(obj, new obj.ctor(...obj.args.map(a => map.get(a))));
          return;
        }

        assert.fail(obj.constructor.name);
      });

      return map.get(entry).obj;
    }
  }

  bit(force=0){
    const bits = this.#bits;
    let bit;

    if(this.#stack.length !== 0 || force){
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

  bits(len, force=0){
    const bits = [];

    if(len === 0) return bits;

    for(let i = 0; i !== len - 1; i++)
      bits.push(this.bit(1));

    bits.push(this.bit(force));

    return bits;
  }
}

class Serializable extends O.Stringifiable{
  ser(ser){ O.virtual('ser'); }
}

class Object extends O.Iterable{}

class Tuple extends Object{
  args = [];

  constructor(ctor, argsNum){
    super();

    this.ctor = ctor;
    this.argsNum = argsNum;
  }

  get chNum(){ return this.argsNum; }
  getCh(i){ return this.args[i]; }
}

class Literal extends Object{
  constructor(obj){
    super();

    this.obj = obj;
  }

  get chNum(){ return 0; }
}

class Wrapper{
  constructor(obj){
    this.obj = obj;
  }
}

module.exports = {
  inc,
  dec,

  Serializer,
  Deserializer,
  Serializable,

  Object,
  Literal,
  Wrapper,
};