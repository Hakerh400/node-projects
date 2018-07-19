'use strict';

const O = require('../framework');

class IO{
  constructor(mchine, input){
    this.machine = machine;
    this.input = Buffer.from(input);
    this.output = [];

    this.inputIndex = 0;
    this.outputIndex = 0;
    this.eof = false;

    machine.setProperty('test', args => {
      args.eval();

      var arg = args.get(0);
      var bit = machine.isTruthy(arg) | 0;

      log(bit);
    })

    /*machine.setproperty('read', this.read.bind(this));
    machine.setproperty('write', this.write.bind(this));
    machine.setproperty('eof', () => this.eof | 0);*/
  }

  getOutput(){
    return Buffer.from('');
  }
};

module.exports = IO;