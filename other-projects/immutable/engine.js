'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');

class Engine{
  constructor(src, input){
    this.src = src;
    this.input = input;
  }

  run(){
    const {src, input} = this;
    const io = new O.IO(input, 0, 1);

    return io.getOutput();
  }
}

module.exports = Engine;