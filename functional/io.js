'use strict';

const O = require('../framework');

class IO{
  constructor(buff){
    this.buff = Buffer.from(buff);
  }

  getOutput(){
    return Buffer.from(this.buff);
  }
};

module.exports = IO;