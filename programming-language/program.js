'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const PL = require('./programming-language');
const StdIO = require('./stdio');
const cgs = require('./common-graph-nodes');

const DEFAULT_FILE_NAME = 'script.txt';

class Program extends SG{
  stdin = new StdIO();
  stdout = new StdIO();
  stderr = new StdIO();

  #lang;
  #intp;

  constructor(langName, source, maxSize, criticalSize=null){
    const lang = PL.get(langName);
    super(lang.graphCtors, lang.graphRefs, maxSize);

    this.criticalSize = criticalSize;

    this.Parser = lang.Parser;
    this.Compiler = lang.Compiler;
    this.Interpreter = lang.Interpreter;

    this.#lang = lang;

    const srcStr = new cgs.String(this, source);
    const fileName = cgs.str(this, DEFAULT_FILE_NAME);
    const script = new cgs.Script(this, srcStr, fileName);
    this.#intp = new lang.Interpreter(this, script).persist();

    this.checkSize();
  }

  get lang(){ return this.#lang; }
  get intp(){ return this.#intp; }
  get th(){ return this.#intp.th; }
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
    const max = this.criticalSize;
    if(max === null || this.size <= max) return;

    const {size} = this;
    this.gc();

    // log(`[GC] ${size} ---> ${this.size} (${this.size - size})`);

    if(this.size > max)
      throw new RangeError('Out of memory');
  }
}

module.exports = Program;