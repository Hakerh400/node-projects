'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Queue{
  #head = null;
  #tail = null;
  #len = 0;

  get len(){ return this.#len; }
  get length(){ return this.#len; }

  push(elem){
    const e = [elem, null];

    this.#len++;

    if(this.#head === null){
      this.#head = this.#tail = e;
      return;
    }

    this.#tail = this.#tail[1] = e;
  }

  pop(){
    const elem = this.#head[0];

    this.#len--;
    this.#head = this.#head[1];

    if(this.#head === null)
      this.#tail = null;

    return elem;
  }
}

module.exports = Queue;