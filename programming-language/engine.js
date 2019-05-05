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

  tick(){

  }
};

module.exports = Engine;