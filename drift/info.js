'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class Info{
  index = null;
  expr = null;
  reducedFrom = [];
  reducedTo = null;
  refs = [];
  #baseSym = null;
  argsNum = null;

  get baseSym(){
    assert(this.#baseSym !== null);
    return this.#baseSym;
  }

  set baseSym(sym){
    assert(typeof sym === 'symbol');
    this.#baseSym = sym;
  }
}

module.exports = Object.assign(Info);