'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const check = require('./check');

const ok = assert.ok;
const eq = assert.strictEqual;

class Collection{
  constructor(arr, type=null, named=1){
    if(type === null){
      type = arr;
      arr = [];
    }

    this.type = check.func(type);
    this.arr = arr = check.arr(arr, type);
    this.named = named;

    this.obj = named ?  O.obj() : null;
    if(named) for(const elem of arr) this.addToObj(elem);

    this.forEach = arr.forEach.bind(arr);
    this.map = arr.map.bind(arr);
    this.findIndex = arr.findIndex.bind(arr);
  }

  get len(){ return this.arr.length; }

  get(entry){
    if(typeof entry === 'string') return this.obj[entry];
    return this.arr[entry];
  }

  set(index, val){
    this.arr[index] = val;
  }

  add(elem){
    this.arr.push(check.elem(elem, this.type));
    if(this.named) this.addToObj(elem);
    return this;
  }

  addToObj(elem){
    ok(this.named);

    const {obj} = this;
    ok('name' in elem);
    
    const {name} = elem;
    ok(!(name in obj));

    this.obj[elem.name] = elem;
    return this;
  }

  randElem(){
    ok(this.len !== 0);
    return O.randElem(this.arr);
  }

  toArr(){
    return this.arr.slice();
  }

  [Symbol.iterator](){
    return this.arr[Symbol.iterator]();
  }

  get length(){ assert.fail(); }
  toString(){ assert.fail(); }
}

module.exports = Collection;