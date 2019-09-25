'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const check = require('./check');

const ok = assert.ok;
const eq = assert.strictEqual;

class Collection{
  constructor(arr, type=null){
    if(type === null){
      type = arr;
      arr = [];
    }

    this.type = check.func(type);
    this.arr = arr = check.arr(arr, type);

    this.forEach = arr.forEach.bind(arr);
    this.map = arr.map.bind(arr);
    this.findIndex = arr.findIndex.bind(arr);
  }

  get len(){ return this.arr.length; }

  get(index){
    return this.arr[index];
  }

  set(index, val){
    this.arr[index] = val;
  }

  add(elem){
    this.arr.push(check.elem(elem, this.type));
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