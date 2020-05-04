'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const {abs} = Math;

const DEBUG = 1;

class Memory{
  #data = O.obj();

  constructor(){
    if(DEBUG) this.log();
  }

  get(addr){
    const data = this.#data;
    if(!(addr in data)) return 0;
    return data[addr];
  }

  set(addr, val){
    const data = this.#data;
    data[addr] = val;
  }

  alloc(size){
    let ptr = 0;

    while(1){
      const n = this.get(ptr);

      if(n === 0){
        this.set(ptr, size);
        this.set(ptr + size + 1, size);
        this.set(ptr + size + 2, 0);

        if(DEBUG) this.log();
        return ptr + 1;
      }

      if(n < 0 && -n - 2 > size){
        const dif = -n - 2 - size

        this.set(ptr, size);
        this.set(ptr + size + 1, size);
        this.set(ptr + size + 2, -dif);
        this.set(ptr - n + 1, -dif);

        if(DEBUG) this.log();
        return ptr + 1;
      }

      ptr += abs(n) + 2;
    }
  }

  free(ptr){
    let start = ptr - 1;
    let size = this.get(start);
    let end = start + size + 1;

    if(start !== 0){
      const n = this.get(start - 1);

      if(n < 0){
        const dif = 2 - n;

        start -= dif;
        size += dif;
      }
    }

    {
      const n = this.get(end + 1);

      if(n === 0){
        this.set(start, 0);
        if(DEBUG) this.log();
        return;
      }

      if(n < 0){
        const dif = 2 - n;

        size += dif;
        end += dif;
      }
    }

    this.set(start, -size);
    this.set(end, -size);

    if(DEBUG) this.log();
  }

  log(){
    log(this.toString());
  }

  toString(){
    const data = this.#data;
    const keys = O.keys(data);

    const max = keys.reduce((a, b) => {
      b |= 0;
      if(data[b] === 0) return a;
      return a > b ? a : b;
    }, -1);

    const arr = O.ca(max + 4, i => {
      return this.get(i);
    });

    return `${arr.map(a => {
      return String(a).padStart(3);
    }).join(' ')}`;
  }
}

module.exports = Memory;