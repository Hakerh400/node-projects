'use strict';

const O = require('../framework');

class IO{
  constructor(machine, input){
    this.machine = machine;
    this.input = Buffer.from(input);
    this.output = Buffer.alloc(1);

    this.inputIndex = 0;
    this.outputIndex = 0;

    machine.addFunc(this.read.bind(this));
    machine.addFunc(this.write.bind(this));
    machine.addFunc(this.isEof.bind(this));
  }

  read(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    if(this.eof())
      return;

    var {inputIndex} = this;
    this.inputIndex++;

    var byteIndex = inputIndex >> 3;
    var bitIndex = inputIndex & 7;

    var bit = (this.input[byteIndex] >> bitIndex) & 1;

    return cbInfo.getIdent(0, bit);
  }

  write(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    var bit = cbInfo.getArg(0) !== cbInfo.getIdent(0, 0);

    var {output, outputIndex} = this;
    this.outputIndex++;

    var byteIndex = outputIndex >> 3;
    var bitIndex = outputIndex & 7;

    if(byteIndex === output.length){
      var buff = Buffer.alloc(output.length);
      this.output = Buffer.concat([output, buff]);
    }

    this.output[byteIndex] |= bit << bitIndex;
  }

  isEof(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;
    
    var eof = this.eof() | 0;

    return cbInfo.getIdent(0, eof);
  }

  eof(){
    return (this.inputIndex >> 3) === this.input.length;
  }

  getOutput(){
    var len = Math.ceil(this.outputIndex / 8);
    var buff = this.output.slice(0, len);

    return Buffer.from(buff);
  }
};

module.exports = IO;