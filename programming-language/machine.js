'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Program = require('./program');

class Machine{
  #lang;
  #script;
  #prog;

  constructor(lang, script, maxSize){
    this.#lang = lang;
    this.#script = script;
    this.#prog = new Program(lang, script, maxSize);
  }

  get lang(){ return this.#lang; }
  get script(){ return this.#script; }

  get stdin(){ return this.#prog.stdin; }
  get stdout(){ return this.#prog.stdout; }
  get stderr(){ return this.#prog.stderr; }

  get active(){ return this.#prog.active; }
  get done(){ return this.#prog.done; }

  tick(){
    this.#prog.tick();
  }
};

module.exports = Machine;