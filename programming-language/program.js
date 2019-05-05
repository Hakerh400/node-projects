'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');

class Program extends SG{
  constructor(lang, maxSize){
    super(maxSize);
  }

  get lang(){ return this.#lang; }
  get script(){ return this.#script; }

  tick(){

  }
};

module.exports = Program;