'use strict';

const O = require('../framework');

function compile(parsed){
  var buff = Buffer.alloc(0);
  var bc = new Bytecode(parsed, buff);

  return bc;
}

class Bytecode{
  constructor(parsed, buff){
    this.parsed = parsed;
    this.buff = buff;
  }

  getParsed(){ return this.parsed; }
  getBuff(){ return this.buff; }
};

module.exports = {
  compile,
  Bytecode,
};