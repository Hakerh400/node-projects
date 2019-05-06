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
    this.#prog = new Program(lang, maxSize);
  }

  get lang(){ return this.#lang; }
  get script(){ return this.#script; }

  tick(){

  }
};

module.exports = Machine;