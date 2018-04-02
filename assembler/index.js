'use strict';

var fs = require('fs');
var O = require('../framework');

const DEBUG = 0;

const MEM_SIZE = 1 << 16;
const MEM_MAX_ADDR = MEM_SIZE - 1;
const MEM_MAX_INT_ADDR = MEM_SIZE - 2;
const MEM_MAX_FLOAT_ADDR = MEM_SIZE - 4;

var regs = require('./machine/registers.json');

var instructions = {
  _0x00:   [0x00, (m) => {}],
  _0x01:   [0x01, (m) => {}],

  mod:     [0x02, (m, a, b) => m.push(a % b & MEM_MAX_ADDR)],

  push:    [0x03, (m, a) => {m.push(a); m.push(a);}],
  pop:     [0x04, (m, a) => {}],

  read:    [0x05, (m, a) => m.push(m.mem.read(a))],
  write:   [0x06, (m, a, b) => m.mem.write(a, b)],

  jmp:     [0x07, (m, a) => m.jump(a)],
  jz:      [0x08, (m, a, b) => a === 0 && m.jump(b)],
  jnz:     [0x09, (m, a, b) => a !== 0 && m.jump(b)],

  pushIp:  [0x0A, (m) => m.push(m.regs.ip)],
  pushSp:  [0x0B, (m) => m.push(m.regs.sp)],
  popSp:   [0x0C, (m, a) => m.regs.sp = a],

  add:     [0x0D, (m, a, b) => m.push(a + b & MEM_MAX_ADDR)],
  sub:     [0x0E, (m, a, b) => m.push(a - b & MEM_MAX_ADDR)],
  mul:     [0x0F, (m, a, b) => m.push(a * b & MEM_MAX_ADDR)],
  div:     [0x10, (m, a, b) => m.push(a / b & MEM_MAX_ADDR)],
  and:     [0x11, (m, a, b) => m.push(a & b)],
  or:      [0x12, (m, a, b) => m.push(a | b)],
  xor:     [0x13, (m, a, b) => m.push(a ^ b)],

  minus:   [0x14, (m, a) => m.push(-a & MEM_MAX_ADDR)],
  neg:     [0x15, (m, a) => m.push(~a & MEM_MAX_ADDR)],
  not:     [0x16, (m, a) => m.push(a === 0 ? 1 : 0)],

  ltp:     [0x17, (m, a, b) => {m.push(a); m.push(b); m.push(a < b ? 1 : 0);}],
  gtp:     [0x18, (m, a, b) => {m.push(a); m.push(b); m.push(a > b ? 1 : 0);}],
  lep:     [0x19, (m, a, b) => {m.push(a); m.push(b); m.push(a <= b ? 1 : 0);}],
  gep:     [0x1A, (m, a, b) => {m.push(a); m.push(b); m.push(a >= b ? 1 : 0);}],

  min:     [0x1B, (m, a, b) => m.push(Math.min(a, b))],
  max:     [0x1C, (m, a, b) => m.push(Math.min(a, b))],
  tern:    [0x1D, (m, a, b, c) => m.push(a !== 0 ? b : c)],

  inc:     [0x1E, (m, a) => m.push(a + 1 & MEM_MAX_ADDR)],
  dec:     [0x1F, (m, a) => m.push(a - 1 & MEM_MAX_ADDR)],

  call:    [0x20, (m, a) => m.call(a)],
  ret:     [0x21, (m) => m.ret()],
  swap:    [0x22, (m, a, b) => m.swap(a, b)],

  eqp:     [0x23, (m, a, b) => {m.push(a); m.push(b); m.push(a === b ? 1 : 0);}],
  neqp:    [0x24, (m, a, b) => {m.push(a); m.push(b); m.push(a !== b ? 1 : 0);}],

  readB:   [0x25, (m, a) => m.push(m.mem.buff[a])],
  writeB:  [0x26, (m, a, b) => m.mem.buff[b] = a],

  lt:      [0x27, (m, a, b) => m.push(a < b ? 1 : 0)],
  gt:      [0x28, (m, a, b) => m.push(a > b ? 1 : 0)],
  le:      [0x29, (m, a, b) => m.push(a <= b ? 1 : 0)],
  ge:      [0x2A, (m, a, b) => m.push(a >= b ? 1 : 0)],
  eq:      [0x2B, (m, a, b) => m.push(a === b ? 1 : 0)],
  neq:     [0x2C, (m, a, b) => m.push(a !== b ? 1 : 0)],

  inf:     [0x2D, (m, a) => m.pushf(m.inf(a & 255)), [0]],
  outf:    [0x2E, (m, a, b) => m.outf(a, b & 255), [1, 0]],

  pushf:   [0x2F, (m, a) => {m.pushf(a); m.pushf(a);}, [1]],
  popf:    [0x30, (m, a) => {}, [1]],

  readf:   [0x31, (m, a) => m.pushf(m.mem.readf(a)), [0]],
  writef:  [0x32, (m, a, b) => m.mem.writef(a, b), [1, 0]],

  addf:    [0x33, (m, a, b) => m.pushf(a + b), [1, 1]],
  subf:    [0x34, (m, a, b) => m.pushf(a - b), [1, 1]],
  mulf:    [0x35, (m, a, b) => m.pushf(a * b), [1, 1]],
  divf:    [0x36, (m, a, b) => m.pushf(a / b), [1, 1]],

  toInt:   [0x37, (m, a) => m.push(a & MEM_MAX_ADDR), [1]],
  toFloat: [0x38, (m, a) => m.pushf(a), [0]],

  in:      [0x39, (m, a) => m.push(m.in(a & 255))],
  out:     [0x3A, (m, a, b) => m.out(a, b & 255)],

  minusf:  [0x3B, (m, a) => m.pushf(-a), [1]],
  notf:    [0x3C, (m, a) => m.push(a === 0 ? 1 : 0), [1]],

  ltpf:    [0x3D, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a < b ? 1 : 0);}, [1, 1]],
  gtpf:    [0x3E, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a > b ? 1 : 0);}, [1, 1]],
  lepf:    [0x3F, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a <= b ? 1 : 0);}, [1, 1]],
  gepf:    [0x40, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a >= b ? 1 : 0);}, [1, 1]],

  ltf:     [0x41, (m, a, b) => m.push(a < b ? 1 : 0), [1, 1]],
  gtf:     [0x42, (m, a, b) => m.push(a > b ? 1 : 0), [1, 1]],
  lef:     [0x43, (m, a, b) => m.push(a <= b ? 1 : 0), [1, 1]],
  gef:     [0x44, (m, a, b) => m.push(a >= b ? 1 : 0), [1, 1]],

  eqpf:    [0x45, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a === b ? 1 : 0);}, [1, 1]],
  neqpf:   [0x46, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a !== b ? 1 : 0);}, [1, 1]],

  eqf:     [0x47, (m, a, b) => m.push(a === b ? 1 : 0), [1, 1]],
  neqf:    [0x48, (m, a, b) => m.push(a !== b ? 1 : 0), [1, 1]],

  minf:    [0x49, (m, a, b) => m.push(Math.min(a, b)), [1, 1]],
  maxf:    [0x4A, (m, a, b) => m.push(Math.min(a, b)), [1, 1]],
  ternf:   [0x4B, (m, a, b, c) => m.push(a !== 0 ? b : c), [0, 1, 1]],

  abs:     [0x4C, (m, a) => m.push(Math.abs(a) & MEM_MAX_ADDR)],
  absf:    [0x4D, (m, a) => m.pushf(Math.abs(a)), [1]],

  sgn:     [0x4E, (m, a) => m.push(Math.sign(a))],
  sgnf:    [0x4F, (m, a) => m.push(Math.sign(a)), [1]],

  acos:    [0x50, (m, a) => m.pushf(Math.acos(a)), [1]],
  acosh:   [0x51, (m, a) => m.pushf(Math.acosh(a)), [1]],
  asin:    [0x52, (m, a) => m.pushf(Math.asin(a)), [1]],
  asinh:   [0x53, (m, a) => m.pushf(Math.asinh(a)), [1]],
  atan:    [0x54, (m, a) => m.pushf(Math.atan(a)), [1]],
  atanh:   [0x55, (m, a) => m.pushf(Math.atanh(a)), [1]],
  atan2:   [0x56, (m, a, b) => m.pushf(Math.atan2(a, b)), [1, 1]],
  ceil:    [0x57, (m, a) => m.pushf(Math.ceil(a)), [1]],
  cbrt:    [0x58, (m, a) => m.pushf(Math.cbrt(a)), [1]],
  cos:     [0x59, (m, a) => m.pushf(Math.cos(a)), [1]],
  cosh:    [0x5A, (m, a) => m.pushf(Math.cosh(a)), [1]],
  exp:     [0x5B, (m, a) => m.pushf(Math.exp(a)), [1]],
  hypot:   [0x5C, (m, a, b) => m.pushf(Math.hypot(a, b)), [1, 1]],
  ln:      [0x5D, (m, a) => m.pushf(Math.log(a)), [1]],
  log2:    [0x5E, (m, a) => m.pushf(Math.log2(a)), [1]],
  log10:   [0x5F, (m, a) => m.pushf(Math.log10(a)), [1]],
  powf:    [0x60, (m, a, b) => m.pushf(Math.pow(a, b)), [1, 1]],
  round:   [0x61, (m, a) => m.pushf(Math.round(a)), [1]],
  sin:     [0x62, (m, a) => m.pushf(Math.sin(a)), [1]],
  sinh:    [0x63, (m, a) => m.pushf(Math.sinh(a)), [1]],
  sqrt:    [0x64, (m, a) => m.pushf(Math.sqrt(a)), [1]],
  tan:     [0x65, (m, a) => m.pushf(Math.tan(a)), [1]],
  tanh:    [0x66, (m, a) => m.pushf(Math.tanh(a)), [1]],
  E:       [0x67, (m) => m.pushf(Math.E)],
  LN10:    [0x68, (m) => m.pushf(Math.LN10)],
  LN2:     [0x69, (m) => m.pushf(Math.LN2)],
  LOG10E:  [0x6A, (m) => m.pushf(Math.LOG10E)],
  LOG2E:   [0x6B, (m) => m.pushf(Math.LOG2E)],
  SQRT1_2: [0x6C, (m) => m.pushf(Math.SQRT1_2)],
  SQRT2:   [0x6D, (m) => m.pushf(Math.SQRT2)],

  PI:      [0x6E, (m) => m.pushf(O.pi)],
  PI2:     [0x6F, (m) => m.pushf(O.pi2)],
  PIH:     [0x70, (m) => m.pushf(O.pih)],

  swapf:   [0x71, (m, a, b) => m.swapf(a, b), [0, 0]],

  push2:   [0x72, (m, a, b) => {m.push(a); m.push(b); m.push(a); m.push(b);}],
  push2f:  [0x73, (m, a, b) => {m.pushf(a); m.pushf(b); m.pushf(a); m.pushf(b);}, [1, 1]],

  modf:    [0x74, (m, a, b) => m.pushf(a % b), [1, 1]],

  varGet:  [0x75, (m, a) => m.push(m.varGet(a))],
  varSet:  [0x76, (m, a, b) => m.varSet(a, b)],

  varGetf: [0x77, (m, a) => m.push(m.varGetf(a)), [0]],
  varSetf: [0x78, (m, a, b) => m.varSetf(a, b), [1, 0]],
};

optimizeInstructions();

class Machine{
  constructor(){
    this.ignoreErrors = false

    this.createRegs();
    this.createMem();
    this.createBuffs();
    this.createListeners();
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
    this.inputBuff = Buffer.alloc(256 * 4);
    this.outputBuff = Buffer.alloc(256 * 4);
  }

  createListeners(){
    this.beforeIn = O.nop;
    this.afterOut = O.nop;
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

      if(/^[\+\-]?(?:\d+|0x[a-f0-9]+)$/i.test(inst)){
        this.mem.buff[index++] = 0;
        this.mem.write(inst, index);
        index += 2;
        return;
      }

      if(/^[\+\-]?(?:(?:\d+|\d+\.\d*|\d*\.\d+)(?:e[\+\-]?\d+)?|0x[a-f0-9]+)f$/i.test(inst)){
        var val = +inst.substring(0, inst.length - 1);
        this.mem.buff[index++] = 1;
        this.mem.writef(val, index);
        index += 4;
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

    if(opCode === 1){
      var val = this.mem.readf(this.regs.ip);
      this.regs.ip = this.regs.ip + 4 & MEM_MAX_ADDR;
      this.pushf(val);
      return;
    }

    if(!(opCode in instructions)){
      if(this.ignoreErrors) return;
      throw new TypeError(`Value 0x${opCode.toString(16).toUpperCase().padStart(2, '0')} is not a valid opcode`);
    }

    if(DEBUG)
      this.debug(opCode);

    var inst = instructions[opCode];
    var func = inst[1];
    var argsLen = func.length - 1;
    var argTypes = inst[2];

    var args = O.ca(argsLen, i => {
      var type = argTypes[argsLen - i - 1];

      if(type === 0) return this.pop();
      else return this.popf();
    }).reverse();

    func(this, ...args);
  }

  disassemble(){
    var buff = this.mem.buff;
    var arr = [];

    for(var i = 0; i < MEM_SIZE;){
      var addr = uint2str(i);
      var opCode = buff[i++];
      var inst;

      if(opCode === 0){
        inst = `_${uint2str(this.mem.read(i))}`;
        i += 2;
      }else if(opCode in instructions){
        inst = instructions.opCodes[opCode];
      }else{
        continue;
      }

      arr.push(`${addr}: ${inst}`);
    }

    return arr.join`\n`;

    function uint2str(uint){
      return `0x${uint.toString(16).toUpperCase().padStart(4, '0')}`;
    }
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
    return this.outputBuff.readUInt16LE(port << 2);
  }

  write(val, port){
    this.inputBuff.writeUInt16LE(val & MEM_MAX_ADDR, port << 2);
  }

  readf(port){
    return this.outputBuff.readFloatLE(port << 2);
  }

  writef(val, port){
    this.inputBuff.writeFloatLE(+val, port << 2);
  }

  in(port){
    this.beforeIn(port);
    return this.inputBuff.readUInt16LE(port << 2);
  }

  out(val, port){
    this.outputBuff.writeUInt16LE(val, port << 2);
    this.afterOut(val, port);
  }

  inf(port){
    this.beforeIn(port);
    return this.inputBuff.readFloatLE(port << 2);
  }

  outf(val, port){
    this.outputBuff.writeFloatLE(val, port << 2);
    this.afterOut(val, port);
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

  pushf(val){
    this.regs.sp = this.regs.sp - 4 & MEM_MAX_ADDR;
    this.mem.writef(val, this.regs.sp);
  }

  popf(){
    var val = this.mem.readf(this.regs.sp);
    this.regs.sp = this.regs.sp + 4 & MEM_MAX_ADDR;
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
    var addr1 = this.regs.sp + index1 & MEM_MAX_ADDR;
    var addr2 = this.regs.sp + index2 & MEM_MAX_ADDR;

    var val1 = this.mem.read(addr1);
    var val2 = this.mem.read(addr2);

    this.mem.write(val1, addr2);
    this.mem.write(val2, addr1);
  }

  swapf(index1, index2){
    var addr1 = this.regs.sp + index1 & MEM_MAX_ADDR;
    var addr2 = this.regs.sp + index2 & MEM_MAX_ADDR;

    var val1 = this.mem.readf(addr1);
    var val2 = this.mem.readf(addr2);

    this.mem.writef(val1, addr2);
    this.mem.writef(val2, addr1);
  }

  varGet(index){
    return this.mem.read(this.regs.sp + index & MEM_MAX_ADDR);
  }

  varSet(val, index){
    return this.mem.write(val, this.regs.sp + index & MEM_MAX_ADDR);
  }

  varGetf(index){
    return this.mem.readf(this.regs.sp + index & MEM_MAX_ADDR);
  }

  varSetf(val, index){
    return this.mem.writef(val, this.regs.sp + index & MEM_MAX_ADDR);
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
    addr &= MEM_MAX_ADDR;
    if(addr > MEM_MAX_INT_ADDR)
      return 0;

    return this.buff.readUInt16LE(addr);
  }

  write(val, addr){
    addr &= MEM_MAX_ADDR;
    if(addr > MEM_MAX_INT_ADDR)
      return;

    this.buff.writeUInt16LE(val & MEM_MAX_ADDR, addr);
  }

  readf(addr){
    addr &= MEM_MAX_ADDR;
    if(addr > MEM_MAX_FLOAT_ADDR)
      return 0;

    return this.buff.readFloatLE(addr);
  }

  writef(val, addr){
    addr &= MEM_MAX_ADDR;
    if(addr > MEM_MAX_FLOAT_ADDR)
      return;

    this.buff.writeFloatLE(val, addr);
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

    var inst = instructions[key];

    if(!('2' in inst))
      inst[2] = [];

    inst[2].push(...O.ca(inst[1].length - inst[2].length - 1, () => 0));

    instructions[opCode] = inst;
    instructions.opCodes[opCode] = key;
  });
}