'use strict';

const MEM_SIZE = 1 << 16;
const MEM_MAX_ADDR = MEM_SIZE - 1;
const MAX_BUFF_SIZE = 100;

var regs = require('./machine/registers.json');

var instructions = {
  load:  [0x00, (M, regs, mem) => regs.ax = mem.readUInt16LE(regs.bx)],
  store: [0x01, (M, regs, mem) => mem.writeUInt16LE(regs.ax, regs.bx)],
  push:  [0x02, (M, regs, mem) => mem.writeUInt16LE(regs.ax, regs.sp = regs.sp - 1 & MEM_MAX_ADDR)],
  pop:   [0x03, (M, regs, mem) => (regs.ax = mem.readUInt16LE(regs.sp++), regs.sp &= MEM_MAX_ADDR)],
  in:    [0x04, (M, regs, mem) => regs.ax = M.inb()],
  out:   [0x05, (M, regs, mem) => M.outb(regs.ax)],
};

class Machine{
  constructor(){
    this.createRegs();
    this.createMem();
    this.createBuffs();
  }

  createRegs(){
    this.regs = Object.create(null);

    regs.forEach(reg => {
      this.regs[reg] = 0;
    });
  }

  createMem(){
    this.mem = Buffer.alloc(MEM_SIZE);
  }

  createBuffs(){
    this.inputBuff = [];
    this.outputBuff = [];
  }

  inb(){
    if(this.inputBuff.length === 0)
      return -1;
    return
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