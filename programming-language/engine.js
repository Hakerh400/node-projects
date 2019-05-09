'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Machine = require('./machine');

class Engine{
  #machine;

  constructor(lang, script, maxSize){
    this.#machine = new Machine(lang, script, maxSize);
  }

  get stdin(){ return this.#machine.stdin; }
  get stdout(){ return this.#machine.stdout; }
  get stderr(){ return this.#machine.stderr; }

  get active(){ return this.#machine.active; }
  get done(){ return this.#machine.done; }

  tick(){
    this.#machine.tick();
  }

  run(ticks=null){
    while(this.active){
      if(ticks !== null && ticks-- === 0) break;
      this.tick();
    }
  }
};

module.exports = Engine;