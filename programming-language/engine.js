'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Machine = require('./machine');
const StdIO = require('./stdio');

class Engine{
  active = 1;
  stdin = new StdIO();
  stdout = new StdIO();
  stderr = new StdIO();

  #machine;

  constructor(lang, script, maxSize){
    this.#machine = new Machine(lang, script, maxSize);
  }

  tick(){
    this.active = 0;
  }

  run(ticks=null){
    while(this.active){
      if(ticks !== null && ticks-- === 0) break;
      this.tick();
    }
  }
};

module.exports = Engine;