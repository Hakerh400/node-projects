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

  #lang;
  #intp;

  constructor(langName, script, maxSize){
    const lang = PL.get(langName);
    super(lang.graphCtors, lang.graphRefs, maxSize);

    this.#lang = lang;
    this.#intp = new lang.Interpreter(this, script).persist();
  }

  get lang(){ return this.#lang; }
  get intp(){ return this.#intp; }
  get active(){ return this.#intp.active; }
  get done(){ return this.#intp.done; }

  tick(){
    this.#intp.tick();
  }
};

module.exports = Program;