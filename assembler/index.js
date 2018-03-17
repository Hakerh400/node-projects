'use strict';

const MEM_SIZE = 1 << 16;
const MEM_MAX_ADDR = MEM_SIZE - 1;

var regs = require('./machine/registers.json');

var instructions = [
  ['load', ]
];

class Machine{
  constructor(){
    this.createRegisters();
    this.createMemory();
    this.createBuffs();
  }

  createRegisters(){
    this.regs = Object.create(null);

    regs.forEach(reg => {
      this.regs[reg] = 0;
    });
  }

  createMemory(){
    this.mem = Buffer.alloc(MEM_SIZE);
  }

  createBuffs(){
    this.inputBuff = [];
    this.outputBuff = [];
  }

  compile(src){
    src = `${src}`;
  }

  write(byte){
    this.inputBuff.push(byte);
  }

  read(){
    if(this.outputBuff.length === 0)
      return null;
    return this.outputBuff.shift();
  }
};

module.exports = {
  Machine,
};