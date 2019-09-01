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
    const src = this.src.toString();
    const io = new O.IO(this.input, 0, 1);

    return io.getOutput();
  }
}

module.exports = Engine;