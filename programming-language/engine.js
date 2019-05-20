'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format = require('../format');
const Machine = require('./machine');

class Engine{
  #machine;

  constructor(lang, script, maxSize, criticalSize){
    this.#machine = new Machine(lang, script, maxSize, criticalSize);
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
    const t = Date.now();
    let n = 0n;

    while(this.active){
      if(ticks !== null && ticks-- === 0) break;
      this.tick();
      n++;
    }

    log(`Time: ${format.time((Date.now() - t) / 1e3 + .5 | 0)}`);
    log(`Instructions: ${format.num(n)}`);
    log();
  }
}

module.exports = Engine;