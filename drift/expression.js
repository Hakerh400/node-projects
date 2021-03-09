'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class Expression{
  get isSym(){ return 0; }
  get isPair(){ return 0; }
}

class Symbol extends Expression{
  constructor(sym){
    super();
    this.sym = sym;
  }

  get isSym(){ return 1; }
}

class Pair extends Expression{
  constructor(fst, snd){
    super();
    this.fst = fst;
    this.snd = snd;
  }

  get isPair(){ return 1; }
}

module.exports = Object.assign(Expression, {
  Symbol,
  Pair,
});