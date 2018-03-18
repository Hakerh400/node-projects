'use strict';

var fs = require('fs');
var O = require('../framework');

const DEBUG = 0;

const MEM_SIZE = 1 << 16;
const MEM_MAX_ADDR = MEM_SIZE - 1;

var regs = require('./machine/registers.json');

var instructions = {
  in:     [0x01, (m, a) => m.push(m.in(a & 255))],
  out:    [0x02, (m, a, b) => m.out(a, b & 255)],

  push:   [0x03, (m, a) => {m.push(a); m.push(a);}],
  pop:    [0x04, (m, a) => {}],

  read:   [0x05, (m, a) => m.push(m.mem.read(a))],
  write:  [0x06, (m, a, b) => m.mem.write(a, b)],

  jmp:    [0x07, (m, a) => m.jump(a)],
  jz:     [0x08, (m, a, b) => a === 0 && m.jump(b)],
  jnz:    [0x09, (m, a, b) => a !== 0 && m.jump(b)],

  pushIp: [0x0A, (m) => m.push(m.regs.ip)],
  pushSp: [0x0B, (m) => m.push(m.regs.sp)],
  popSp:  [0x0C, (m, a) => m.regs.sp = a],

  add:    [0x0D, (m, a, b) => m.push(a + b & MEM_MAX_ADDR)],
  sub:    [0x0E, (m, a, b) => m.push(a - b & MEM_MAX_ADDR)],
  mul:    [0x0F, (m, a, b) => m.push(a * b & MEM_MAX_ADDR)],
  div:    [0x10, (m, a, b) => m.push(a / b & MEM_MAX_ADDR)],
  and:    [0x11, (m, a, b) => m.push(a & b)],
  or:     [0x12, (m, a, b) => m.push(a | b)],
  xor:    [0x13, (m, a, b) => m.push(a ^ b)],

  minus:  [0x14, (m, a) => m.push(-a & MEM_MAX_ADDR)],
  neg:    [0x15, (m, a) => m.push(~a & MEM_MAX_ADDR)],
  not:    [0x16, (m, a) => m.push(a === 0 ? 1 : 0)],

  lt:     [0x17, (m, a, b) => {m.push(a); m.push(b); m.push(a < b ? 1 : 0);}],
  gt:     [0x18, (m, a, b) => {m.push(a); m.push(b); m.push(a > b ? 1 : 0);}],
  le:     [0x19, (m, a, b) => {m.push(a); m.push(b); m.push(a <= b ? 1 : 0);}],
  ge:     [0x1A, (m, a, b) => {m.push(a); m.push(b); m.push(a >= b ? 1 : 0);}],

  min:    [0x1B, (m, a, b) => m.push(Math.min(a, b))],
  max:    [0x1C, (m, a, b) => m.push(Math.min(a, b))],
  tern:   [0x1D, (m, a, b, c) => m.push(a !== 0 ? b : c)],

  inc:    [0x1E, (m, a) => m.push(a + 1 & MEM_MAX_ADDR)],
  dec:    [0x1F, (m, a) => m.push(a - 1 & MEM_MAX_ADDR)],

  call:   [0x20, (m, a) => m.call(a)],
  ret:    [0x21, (m) => m.ret()],
  swap:   [0x22, (m, a, b) => m.swap(a, b)],

  eq:     [0x23, (m, a, b) => {m.push(a); m.push(b); m.push(a === b ? 1 : 0);}],
  neq:    [0x24, (m, a, b) => {m.push(a); m.push(b); m.push(a !== b ? 1 : 0);}],

  readB:  [0x25, (m, a) => m.push(m.mem.buff[a])],
  writeB: [0x26, (m, a, b) => m.mem.buff[b] = a],

  mod:    [0x27, (m, a, b) => m.push(a % b & MEM_MAX_ADDR)],

  push2:  [0x28, (m, a, b) => {m.push(a); m.push(b); m.push(a); m.push(b);}],

  ltp:    [0x29, (m, a, b) => m.push(a < b ? 1 : 0)],
  gtp:    [0x2A, (m, a, b) => m.push(a > b ? 1 : 0)],
  lep:    [0x2B, (m, a, b) => m.push(a <= b ? 1 : 0)],
  gep:    [0x2C, (m, a, b) => m.push(a >= b ? 1 : 0)],
  eqp:    [0x2D, (m, a, b) => m.push(a === b ? 1 : 0)],
  neqp:   [0x2E, (m, a, b) => m.push(a !== b ? 1 : 0)],
};

optimizeInstructions();

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
    this.mem = new Memory();
  }

  createBuffs(){
    this.inputBuff = Buffer.alloc(512);
    this.outputBuff = Buffer.alloc(512);
  }

  compile(src){
    var str = `${src}`;
    var insts = str.split(/\s+/);
    var index = 0;

    var labels = Object.create(null);
    var labelsQueue = [];

    insts.forEach(inst => {
      if(/^\_/.test(inst)){
        var val = inst.substring(1) & 0xFF;
        this.mem.buff[index++] = val;
        return;
      }

      if(/^\-?(?:\d+|0x[a-f0-9]+)$/i.test(inst)){
        this.mem.buff[index++] = 0;
        this.mem.write(inst, index);
        index += 2;
        return;
      }

      if(/\:$/.test(inst)){
        var label = inst.substring(0, inst.length - 1);
        labels[label] = index;
        return;
      }

      if(/^\:/.test(inst)){
        this.mem.buff[index++] = 0;
        var label = inst.substring(1);
        labelsQueue.push([label, index]);
        index += 2;
        return;
      }

      if(!(inst in instructions))
        throw new SyntaxError(`Unknown instruction "${inst}"`);

      var opCode = instructions[inst][0];
      this.mem.buff[index++] = opCode;
    });

    labelsQueue.forEach(([label, index]) => {
      if(!(label in labels))
        throw new SyntaxError(`Unknown label ${label}`);

      this.mem.write(labels[label], index);
    });
  }

  exec(input){
    if(typeof input === 'undefined') input = [];
    else if(typeof input === 'string') input = Buffer.from(input);
    else if(typeof input === 'number') input = [input];
    else if(input instanceof Array) input = [...input];
    else if(input instanceof Buffer) input = Buffer.from(input);
    else throw new TypeError('Invalid arguments');

    var index = 0;
    var output = [];

    while(index !== input.length){
      this.write(input[index++], 0);
      this.write(1, 1);

      if(!readOutput(this))
        return output;
    }

    this.write(2, 1);
    while(readOutput(this));

    return output;

    function readOutput(machine){
      var out;
      var status;

      machine.out(0, 1);

      do{
        machine.tick();
        status = machine.read(1);
      }while(status === 0);

      if(status === 2)
        return 0;

      if(status === 3)
        return 1;

      out = machine.read(0);
      output.push(out);

      return 1;
    }
  }

  tick(){
    var opCode = this.mem.buff[this.regs.ip];
    this.regs.ip = this.regs.ip + 1 & MEM_MAX_ADDR;

    if(opCode === 0){
      var val = this.mem.read(this.regs.ip);
      this.regs.ip = this.regs.ip + 2 & MEM_MAX_ADDR;
      this.push(val);
      return;
    }

    if(!(opCode in instructions))
      throw new TypeError(`Value 0x${opCode.toString(16).toUpperCase().padStart(2, '0')} is not a valid opcode`);

    if(DEBUG)
      this.debug(opCode);

    var inst = instructions[opCode][1];
    var argsLen = inst.length - 1;
    var args = O.ca(argsLen, () => this.pop()).reverse();

    inst(this, ...args);
  }

  reset(){
    this.resetRegs();
    this.resetMem();
    this.resetBuffs();
  }

  resetRegs(){
    regs.forEach(reg => {
      this.regs[reg] = 0;
    });
  }

  resetMem(){
    this.mem.fill(0);
  }

  resetBuffs(){
    this.inputBuff.fill(0);
    this.outputBuff.fill(0);
  }

  read(port){
    return this.outputBuff.readUInt16LE(port << 1);
  }

  write(val, port){
    this.inputBuff.writeUInt16LE(val, port << 1);
  }

  in(port){
    return this.inputBuff.readUInt16LE(port << 1);
  }

  out(val, port){
    this.outputBuff.writeUInt16LE(val, port << 1);
  }

  push(val){
    this.regs.sp = this.regs.sp - 2 & MEM_MAX_ADDR;
    this.mem.write(val, this.regs.sp);
  }

  pop(){
    var val = this.mem.read(this.regs.sp);
    this.regs.sp = this.regs.sp + 2 & MEM_MAX_ADDR;
    return val;
  }

  jump(addr){
    this.regs.ip = addr;
  }

  call(addr){
    this.push(this.regs.ip);
    this.jump(addr);
  }

  ret(){
    var addr = this.pop();
    this.regs.ip = addr;
  }

  swap(index1, index2){
    var addr1 = this.regs.sp + (index1 << 1);
    var addr2 = this.regs.sp + (index2 << 1);

    var val1 = this.mem.read(addr1);
    var val2 = this.mem.read(addr2);

    this.mem.write(val1, addr2);
    this.mem.write(val2, addr1);
  }

  debug(opCode){
    this.logStack();
    console.log(instructions.opCodes[opCode]);

    fs.readSync(process.stdin.fd, Buffer.alloc(2), 0, 2);
  }

  logStack(){
    var len = (-this.regs.sp & MEM_MAX_ADDR) >> 1;
    var arr = [];

    for(var i = 1; i <= len; i++){
      var val = this.mem.read(-i * 2 & MEM_MAX_ADDR);
      val = val.toString(16).toUpperCase();
      arr.push(val.padStart(Math.ceil(val.length / 2) * 2, '0'));
    }

    console.log(arr.join` `);
  }
};

class Memory{
  constructor(){
    this.buff = Buffer.alloc(MEM_SIZE);
  }

  read(addr){
    if(addr !== MEM_MAX_ADDR) return this.buff.readUInt16LE(addr);
    return (this.buff[0] << 8) | this.buff[MEM_MAX_ADDR];
  }

  write(val, addr){
    if(addr !== MEM_MAX_ADDR) return this.buff.writeUInt16LE(val & MEM_MAX_ADDR, addr);
    this.buff[MEM_MAX_ADDR] = addr & 255;
    this.buff[0] = addr >> 8;
  }
};

module.exports = {
  Machine,
};

function optimizeInstructions(){
  var keys = Object.keys(instructions);

  instructions.opCodes = Object.create(null);

  O.repeat(256, opCode => {
    var key = keys.find(key => instructions[key][0] === opCode);
    if(!key) return;

    instructions[opCode] = instructions[key];
    instructions.opCodes[opCode] = key;
  });
}