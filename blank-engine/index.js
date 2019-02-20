'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Engine{
  constructor(src, input){
    this.src = Buffer.from(src);
    this.input = Buffer.from(input);
  }

  run(){
    return this.input;
  }
};

module.exports = Engine;