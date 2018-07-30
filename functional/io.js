'use strict';

const O = require('../framework');

class IO{
  constructor(machine, input){
    this.machine = machine;
    this.input = input;
    this.output = '';

    machine.addFunc(this.read.bind(this));
    machine.addFunc(this.write.bind(this));
    machine.addFunc(this.eof.bind(this));
  }

  getOutput(){
    return this.output;
  }

  read(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    if(this.input.length === 0) return;
    var bit = this.input[0] | 0;
    this.input = this.input.substring(1);

    return cbInfo.getIdent(0, bit);
  }

  write(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    var arg = cbInfo.getArg(0);
    var bit = arg !== cbInfo.getIdent(0, 0) | 0;
    this.output += String(bit);

    return arg;
  }

  eof(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    var eof = this.input.length === 0 | 0;

    return cbInfo.getIdent(0, eof);
  }
};

module.exports = IO;