'use strict';

const O = require('../framework');

class IO{
  constructor(machine, input){
    this.machine = machine;
    this.input = Buffer.from(input);
    this.output = Buffer.alloc(0);

    this.inputIndex = 0;
    this.outputIndex = 0;

    machine.addFunc(this.read.bind(this));
    machine.addFunc(this.write.bind(this));
    machine.addFunc(this.isEof.bind(this));
  }

  *read(cbInfo){
    yield cbInfo.evalArgs();

    if(this.eof())
      return;

    var {inputIndex} = this;
    this.inputIndex++;

    var byteIndex = inputIndex >> 3;
    var bitIndex = inputIndex & 7;

    var bit = (this.input[byteIndex] >> bitIndex) & 1;
    cbInfo.ret(cbInfo.getIdent(bit));
  }

  *write(cbInfo){
    yield cbInfo.evalArgs();

    var bit = cbInfo.getArg(0) !== cbInfo.getIdent(0);

    var {output, outputIndex} = this;
    this.outputIndex++;

    var byteIndex = outputIndex >> 3;
    var bitIndex = outputIndex & 7;

    if(byteIndex === output.length){
      var buff = Buffer.alloc(output.length);
      output = Buffer.concat([output, buff]);
    }

    this.output[byteIndex] |= 1 << bitIndex;
  }

  *isEof(cbInfo){
    yield cbInfo.evalArgs();
    
    var eof = this.eof() | 0;
    cbInfo.ret(cbInfo.getIdent(eof));
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