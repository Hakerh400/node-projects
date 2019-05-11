'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const PL = require('./programming-language');
const StdIO = require('./stdio');

class Program extends SG{
  stdin = new StdIO();
  stdout = new StdIO();
  stderr = new StdIO();

  #maxSize;
  #lang;
  #intp;

  constructor(langName, script, maxSize=null){
    const lang = PL.get(langName);
    super(lang.graphCtors, lang.graphRefs);

    this.#maxSize = maxSize;

    this.#lang = lang;
    this.#intp = new lang.Interpreter(this, script).persist();

    this.checkSize();
  }

  get maxSize(){ return this.#maxSize; }
  get lang(){ return this.#lang; }
  get intp(){ return this.#intp; }
  get active(){ return this.#intp.active; }
  get done(){ return this.#intp.done; }

  tick(){
    this.#intp.tick();
    this.checkSize();
  }

  deser(ser){
    super.deser(ser);
    this.#intp = this.main;
    return this;
  }

  checkSize(){
    const max = this.#maxSize;
    if(max === null || this.size <= max) return;

    const {size} = this;
    this.refresh();

    if(this.size > max)
      throw new RangeError('Out of memory');

    log(`[GC] ${size} ---> ${this.size} (${this.size - size})`);
  }
};

module.exports = Program;