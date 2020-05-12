'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const {abs} = Math;

const DEBUG = 0;

class Memory{
  #data = O.obj();
  #max = 0;

  constructor(){
    if(DEBUG) this.log();
  }

  get max(){ return this.#max; }

  get(addr){
    const data = this.#data;
    if(!(addr in data)) return 0;
    return data[addr];
  }

  set(addr, val){
    const data = this.#data;
    data[addr] = val;
    if(addr > this.#max) this.#max = addr;
  }

  alloc(size){
    assert(size > 0, 'Memory block size must be positive');

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
    assert(ptr > 0, 'Memory block address must be in the heap');

    let size = this.get(start);
    assert(size > 0, 'Memory block is not allocated');

    let end = start + size + 1;

    if(start !== 0){
      const n = this.get(start - 1);

      if(n < 0){
        const dif = 2 - n;

        start -= dif;
        size += dif;

        assert(start >= 0, 'Heap corruption (invalid previous block size)');
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

    const arr = O.ca(this.#max + 4, i => {
      return this.get(i);
    });

    return `${arr.map(a => {
      return String(a).padStart(3);
    }).join(' ')}`;
  }
}

module.exports = Memory;