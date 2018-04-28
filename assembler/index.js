'use strict';

var fs = require('fs');
var O = require('../framework');
var regs = require('./machine/registers.json');

const DEBUG = 0;

const MEM_SIZE = 1 << 30;
const MEM_MAX_ADDR = MEM_SIZE - 1 | 0;
const MEM_MAX_INT_ADDR = MEM_SIZE - 4;
const MEM_MAX_FLOAT_ADDR = MEM_SIZE - 4;

const SPEED = 100e3 | 0;

var instructions = {
  _0x00:    [0x00, (m) => {}],
  _0x01:    [0x01, (m) => {}],

  mod:      [0x02, (m, a, b) => m.push(a % b & MEM_MAX_ADDR)],

  push:     [0x03, (m, a) => {m.push(a); m.push(a);}],
  pop:      [0x04, (m, a) => {}],

  read:     [0x05, (m, a) => m.push(m.mem.read(a))],
  write:    [0x06, (m, a, b) => m.mem.write(a, b)],

  jmp:      [0x07, (m, a) => m.jump(a)],
  jz:       [0x08, (m, a, b) => a === 0 && m.jump(b)],
  jnz:      [0x09, (m, a, b) => a !== 0 && m.jump(b)],

  pushEip:  [0x0A, (m) => m.push(m.regs.eip & MEM_MAX_ADDR)],
  pushEsp:  [0x0B, (m) => m.push(m.regs.esp & MEM_MAX_ADDR)],
  popEsp:   [0x0C, (m, a) => m.regs.esp = a & MEM_MAX_ADDR],

  add:      [0x0D, (m, a, b) => m.push(a + b & MEM_MAX_ADDR)],
  sub:      [0x0E, (m, a, b) => m.push(a - b & MEM_MAX_ADDR)],
  mul:      [0x0F, (m, a, b) => m.push(a * b & MEM_MAX_ADDR)],
  div:      [0x10, (m, a, b) => m.push(a / b & MEM_MAX_ADDR)],
  and:      [0x11, (m, a, b) => m.push((a & b) & MEM_MAX_ADDR)],
  or:       [0x12, (m, a, b) => m.push((a | b) & MEM_MAX_ADDR)],
  xor:      [0x13, (m, a, b) => m.push((a ^ b) & MEM_MAX_ADDR)],

  minus:    [0x14, (m, a) => m.push(-a & MEM_MAX_ADDR)],
  neg:      [0x15, (m, a) => m.push(~a & MEM_MAX_ADDR)],
  not:      [0x16, (m, a) => m.push(a === 0 ? 1 : 0)],

  ltp:      [0x17, (m, a, b) => {m.push(a); m.push(b); m.push(a < b ? 1 : 0);}],
  gtp:      [0x18, (m, a, b) => {m.push(a); m.push(b); m.push(a > b ? 1 : 0);}],
  lep:      [0x19, (m, a, b) => {m.push(a); m.push(b); m.push(a <= b ? 1 : 0);}],
  gep:      [0x1A, (m, a, b) => {m.push(a); m.push(b); m.push(a >= b ? 1 : 0);}],

  min:      [0x1B, (m, a, b) => m.push(Math.min(a, b))],
  max:      [0x1C, (m, a, b) => m.push(Math.min(a, b))],
  tern:     [0x1D, (m, a, b, c) => m.push(a !== 0 ? b : c)],

  inc:      [0x1E, (m, a) => m.push(a + 1 & MEM_MAX_ADDR)],
  dec:      [0x1F, (m, a) => m.push(a - 1 & MEM_MAX_ADDR)],

  call:     [0x20, (m, a) => m.call(a)],
  ret:      [0x21, (m, a) => m.ret(a)],
  swap:     [0x22, (m, a, b) => m.swap(a, b)],

  eqp:      [0x23, (m, a, b) => {m.push(a); m.push(b); m.push(a === b ? 1 : 0);}],
  neqp:     [0x24, (m, a, b) => {m.push(a); m.push(b); m.push(a !== b ? 1 : 0);}],

  readB:    [0x25, (m, a) => m.push(m.mem.buff[a])],
  writeB:   [0x26, (m, a, b) => m.mem.buff[b] = a],

  lt:       [0x27, (m, a, b) => m.push(a < b ? 1 : 0)],
  gt:       [0x28, (m, a, b) => m.push(a > b ? 1 : 0)],
  le:       [0x29, (m, a, b) => m.push(a <= b ? 1 : 0)],
  ge:       [0x2A, (m, a, b) => m.push(a >= b ? 1 : 0)],
  eq:       [0x2B, (m, a, b) => m.push(a === b ? 1 : 0)],
  neq:      [0x2C, (m, a, b) => m.push(a !== b ? 1 : 0)],

  inf:      [0x2D, (m, a) => m.pushf(m.inf(a & 255)), [0]],
  outf:     [0x2E, (m, a, b) => m.outf(a, b & 255), [1, 0]],

  pushf:    [0x2F, (m, a) => {m.pushf(a); m.pushf(a);}, [1]],
  popf:     [0x30, (m, a) => {}, [1]],

  readf:    [0x31, (m, a) => m.pushf(m.mem.readf(a)), [0]],
  writef:   [0x32, (m, a, b) => m.mem.writef(a, b), [1, 0]],

  addf:     [0x33, (m, a, b) => m.pushf(a + b), [1, 1]],
  subf:     [0x34, (m, a, b) => m.pushf(a - b), [1, 1]],
  mulf:     [0x35, (m, a, b) => m.pushf(a * b), [1, 1]],
  divf:     [0x36, (m, a, b) => m.pushf(a / b), [1, 1]],

  toInt:    [0x37, (m, a) => m.push(a & MEM_MAX_ADDR), [1]],
  toFloat:  [0x38, (m, a) => m.pushf(a), [0]],

  in:       [0x39, (m, a) => m.push(m.in(a & 255))],
  out:      [0x3A, (m, a, b) => m.out(a, b & 255)],

  minusf:   [0x3B, (m, a) => m.pushf(-a), [1]],
  notf:     [0x3C, (m, a) => m.push(a === 0 ? 1 : 0), [1]],

  ltpf:     [0x3D, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a < b ? 1 : 0);}, [1, 1]],
  gtpf:     [0x3E, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a > b ? 1 : 0);}, [1, 1]],
  lepf:     [0x3F, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a <= b ? 1 : 0);}, [1, 1]],
  gepf:     [0x40, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a >= b ? 1 : 0);}, [1, 1]],

  ltf:      [0x41, (m, a, b) => m.push(a < b ? 1 : 0), [1, 1]],
  gtf:      [0x42, (m, a, b) => m.push(a > b ? 1 : 0), [1, 1]],
  lef:      [0x43, (m, a, b) => m.push(a <= b ? 1 : 0), [1, 1]],
  gef:      [0x44, (m, a, b) => m.push(a >= b ? 1 : 0), [1, 1]],

  eqpf:     [0x45, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a === b ? 1 : 0);}, [1, 1]],
  neqpf:    [0x46, (m, a, b) => {m.pushf(a); m.pushf(b); m.push(a !== b ? 1 : 0);}, [1, 1]],

  eqf:      [0x47, (m, a, b) => m.push(a === b ? 1 : 0), [1, 1]],
  neqf:     [0x48, (m, a, b) => m.push(a !== b ? 1 : 0), [1, 1]],

  minf:     [0x49, (m, a, b) => m.push(Math.min(a, b)), [1, 1]],
  maxf:     [0x4A, (m, a, b) => m.push(Math.min(a, b)), [1, 1]],
  ternf:    [0x4B, (m, a, b, c) => m.push(a !== 0 ? b : c), [0, 1, 1]],

  abs:      [0x4C, (m, a) => m.push(Math.abs(a) & MEM_MAX_ADDR)],
  absf:     [0x4D, (m, a) => m.pushf(Math.abs(a)), [1]],

  sgn:      [0x4E, (m, a) => m.push(Math.sign(a))],
  sgnf:     [0x4F, (m, a) => m.push(Math.sign(a)), [1]],

  acos:     [0x50, (m, a) => m.pushf(Math.acos(a)), [1]],
  acosh:    [0x51, (m, a) => m.pushf(Math.acosh(a)), [1]],
  asin:     [0x52, (m, a) => m.pushf(Math.asin(a)), [1]],
  asinh:    [0x53, (m, a) => m.pushf(Math.asinh(a)), [1]],
  atan:     [0x54, (m, a) => m.pushf(Math.atan(a)), [1]],
  atanh:    [0x55, (m, a) => m.pushf(Math.atanh(a)), [1]],
  atan2:    [0x56, (m, a, b) => m.pushf(Math.atan2(a, b)), [1, 1]],
  ceil:     [0x57, (m, a) => m.pushf(Math.ceil(a)), [1]],
  cbrt:     [0x58, (m, a) => m.pushf(Math.cbrt(a)), [1]],
  cos:      [0x59, (m, a) => m.pushf(Math.cos(a)), [1]],
  cosh:     [0x5A, (m, a) => m.pushf(Math.cosh(a)), [1]],
  exp:      [0x5B, (m, a) => m.pushf(Math.exp(a)), [1]],
  hypot:    [0x5C, (m, a, b) => m.pushf(Math.hypot(a, b)), [1, 1]],
  ln:       [0x5D, (m, a) => m.pushf(Math.log(a)), [1]],
  log2:     [0x5E, (m, a) => m.pushf(Math.log2(a)), [1]],
  log10:    [0x5F, (m, a) => m.pushf(Math.log10(a)), [1]],
  powf:     [0x60, (m, a, b) => m.pushf(Math.pow(a, b)), [1, 1]],
  round:    [0x61, (m, a) => m.pushf(Math.round(a)), [1]],
  sin:      [0x62, (m, a) => m.pushf(Math.sin(a)), [1]],
  sinh:     [0x63, (m, a) => m.pushf(Math.sinh(a)), [1]],
  sqrt:     [0x64, (m, a) => m.pushf(Math.sqrt(a)), [1]],
  tan:      [0x65, (m, a) => m.pushf(Math.tan(a)), [1]],
  tanh:     [0x66, (m, a) => m.pushf(Math.tanh(a)), [1]],
  E:        [0x67, (m) => m.pushf(Math.E)],
  LN10:     [0x68, (m) => m.pushf(Math.LN10)],
  LN2:      [0x69, (m) => m.pushf(Math.LN2)],
  LOG10E:   [0x6A, (m) => m.pushf(Math.LOG10E)],
  LOG2E:    [0x6B, (m) => m.pushf(Math.LOG2E)],
  SQRT1_2:  [0x6C, (m) => m.pushf(Math.SQRT1_2)],
  SQRT2:    [0x6D, (m) => m.pushf(Math.SQRT2)],

  PI:       [0x6E, (m) => m.pushf(O.pi)],
  PI2:      [0x6F, (m) => m.pushf(O.pi2)],
  PIH:      [0x70, (m) => m.pushf(O.pih)],

  swapf:    [0x71, (m, a, b) => m.swapf(a, b), [0, 0]],

  push2:    [0x72, (m, a, b) => {m.push(a); m.push(b); m.push(a); m.push(b);}],
  push2f:   [0x73, (m, a, b) => {m.pushf(a); m.pushf(b); m.pushf(a); m.pushf(b);}, [1, 1]],

  modf:     [0x74, (m, a, b) => m.pushf(a % b), [1, 1]],

  varGet:   [0x75, (m, a) => m.push(m.varGet(a))],
  varSet:   [0x76, (m, a, b) => m.varSet(a, b)],

  varGetf:  [0x77, (m, a) => m.push(m.varGetf(a)), [0]],
  varSetf:  [0x78, (m, a, b) => m.varSetf(a, b), [1, 0]],

  pushEbp:  [0x79, (m) => m.push(m.regs.ebp & MEM_MAX_ADDR)],
  popEbp:   [0x7A, (m, a) => m.regs.ebp = a & MEM_MAX_ADDR],

  enter:    [0x7B, (m, a) => m.enter(a)],
  leave:    [0x7C, (m, a) => m.leave(a)],

  pushEax:  [0x7D, (m) => m.push(m.regs.eax & MEM_MAX_ADDR)],
  popEax:   [0x7E, (m, a) => m.regs.eax = a & MEM_MAX_ADDR],

  retv:     [0x7F, (m, a) => m.retv(a)],
  leavev:   [0x80, (m, a) => m.leavev(a)],

  pushIvtp: [0x81, (m) => m.push(m.regs.ivtp & MEM_MAX_ADDR)],
  popIvtp:  [0x82, (m, a) => m.regs.ivtp = a & MEM_MAX_ADDR],

  pushPsw:  [0x83, (m) => m.push(m.regs.psw & MEM_MAX_ADDR)],
  popPsw:   [0x84, (m, a) => m.regs.psw = a & MEM_MAX_ADDR],

  inte:     [0x85, (m) => m.inte(), [], 1],
  intd:     [0x86, (m) => m.intd(), [], 1],
  trpe:     [0x87, (m) => m.trpe(), [], 1],
  trpd:     [0x88, (m) => m.trpd(), [], 1],

  int:      [0x89, (m, a) => m.int(a), [0], 1],
  rti:      [0x8A, (m) => m.rti(), [], 1],

  halt:     [0x8B, (m) => m.halt()],

  shl:      [0x8C, (m, a, b) => m.push(a << b)],
  shr:      [0x8D, (m, a, b) => m.push(a >> b)],

  land:     [0x8E, (m, a, b) => m.push(((a !== 0) & (b !== 0)) & MEM_MAX_ADDR)],
  lor:      [0x8F, (m, a, b) => m.push(((a !== 0) | (b !== 0)) & MEM_MAX_ADDR)],
};

optimizeInstructions();

class Machine{
  constructor(){
    this.ignoreErrors = false;

    this.createRegs();
    this.createMem();
    this.createBuffs();

    this.halted = true;
    this.intReqs = [];
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
    this.portsBuff = Buffer.alloc(256 * 4);
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
        index += 4;
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
        index += 4;
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

  start(){
    var m = this;
    
    m.halted = false;
    setTimeout(exec);

    function exec(){
      for(var i = 0; i < SPEED; i++){
        m.tick();

        if(m.halted)
          return;
      }

      setTimeout(exec);
    }
  }

  tick(){
    var str;

    if(DEBUG){
      var str = Object.getOwnPropertyNames(this.regs).map(a => {
        return `${a}=${formatInt(this.regs[a], 1)}`;
      }).join(', ');
      var arr = [];
      for(var i = 0; 1; i -= 4){
        if(i !== 0)
          arr.push(formatInt(this.mem.read(i)));
        if((i & MEM_MAX_ADDR) === this.regs.esp)
          break;
      }
      str += `\n[${arr.join`, `}]`;
    }

    var opCode = this.mem.buff[this.regs.eip];
    this.regs.eip = this.regs.eip + 1 & MEM_MAX_ADDR;

    if(opCode === 0){
      var val = this.mem.read(this.regs.eip);
      this.regs.eip = this.regs.eip + 4 & MEM_MAX_ADDR;
      this.push(val);

      if(DEBUG)
        this.debug(`Integer ${formatInt(val)}`, str);

      return;
    }

    if(opCode === 1){
      var val = this.mem.readf(this.regs.eip);
      this.regs.eip = this.regs.eip + 4 & MEM_MAX_ADDR;
      this.pushf(val);

      if(DEBUG)
        this.debug(`Float ${formatInt(val)}`, str);

      return;
    }

    if(!(opCode in instructions)){
      if(this.ignoreErrors) return;
      throw new TypeError(`Value 0x${opCode.toString(16).toUpperCase().padStart(2, '0')} is not a valid opcode`);
    }

    if(DEBUG)
      this.debug(instructions.opCodes[opCode], str);

    var inst = instructions[opCode];
    var func = inst[1];
    var argsLen = func.length - 1;
    var argTypes = inst[2];
    var disableInts = inst[3];

    var args = O.ca(argsLen, i => {
      var type = argTypes[argsLen - i - 1];

      if(type === 0) return this.pop();
      else return this.popf();
    }).reverse();

    func(this, ...args);

    if(!disableInts){
      if(this.intReqs.length !== 0){
        if(this.int(this.intReqs[0]))
          this.intReqs.shift();
      }else{
        if(this.regs.psw & 2)
          this.int(0x00);
      }
    }
  }

  halt(){
    this.halted = true;
  }

  disassemble(){
    var buff = this.mem.buff;
    var arr = [];

    for(var i = 0; i < MEM_SIZE;){
      var addr = uint2str(i);
      var opCode = buff[i++];
      var inst;

      if(opCode === 0){
        inst = `${uint2str(this.mem.read(i))}`;
        i += 4;
      }else if(opCode === 1){
        inst = `${this.mem.readf(i)}f`;
        i += 4;
      }else if(opCode in instructions){
        inst = instructions.opCodes[opCode];
      }else{
        continue;
      }

      arr.push(`${addr}: ${inst}`);
    }

    return arr.join('\n');

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
    this.portsBuff.fill(0);
  }

  in(port){
    return this.portsBuff.readUInt32LE(port << 2);
  }

  out(val, port){
    this.portsBuff.writeUInt32LE(val, port << 2);
  }

  inf(port){
    return this.portsBuff.readFloatLE(port << 2);
  }

  outf(val, port){
    this.portsBuff.writeFloatLE(val, port << 2);
  }

  push(val){
    this.regs.esp = this.regs.esp - 4 & MEM_MAX_ADDR;
    this.mem.write(val, this.regs.esp);
  }

  pop(){
    var val = this.mem.read(this.regs.esp);
    this.regs.esp = this.regs.esp + 4 & MEM_MAX_ADDR;
    return val;
  }

  pushf(val){
    this.regs.esp = this.regs.esp - 4 & MEM_MAX_ADDR;
    this.mem.writef(val, this.regs.esp);
  }

  popf(){
    var val = this.mem.readf(this.regs.esp);
    this.regs.esp = this.regs.esp + 4 & MEM_MAX_ADDR;
    return val;
  }

  jump(addr){
    this.regs.eip = addr & MEM_MAX_ADDR;
  }

  call(addr){
    this.push(this.regs.eip & MEM_MAX_ADDR);
    this.jump(addr & MEM_MAX_ADDR);
  }

  ret(size){
    var addr = this.pop() & MEM_MAX_ADDR;
    this.regs.eip = addr;
    this.regs.esp = this.regs.esp + size & MEM_MAX_ADDR;
    this.push(this.regs.eax & MEM_MAX_ADDR);
  }

  retv(size){
    var addr = this.pop() & MEM_MAX_ADDR;
    this.regs.eip = addr;
    this.regs.esp = this.regs.esp + size & MEM_MAX_ADDR;
  }

  enter(size){
    this.push(this.regs.ebp & MEM_MAX_ADDR);
    this.regs.ebp = this.regs.esp;
    this.regs.esp = this.regs.esp - size & MEM_MAX_ADDR;
  }

  leave(size){
    this.regs.eax = this.pop() & MEM_MAX_ADDR;
    this.regs.esp = this.regs.ebp;
    this.regs.ebp = this.pop() & MEM_MAX_ADDR;
    this.ret(size);
  }

  leavev(size){
    this.regs.esp = this.regs.ebp;
    this.regs.ebp = this.pop() & MEM_MAX_ADDR;
    this.retv(size);
  }

  swap(index1, index2){
    var addr1 = this.regs.esp + index1 & MEM_MAX_ADDR;
    var addr2 = this.regs.esp + index2 & MEM_MAX_ADDR;

    var val1 = this.mem.read(addr1);
    var val2 = this.mem.read(addr2);

    this.mem.write(val1, addr2);
    this.mem.write(val2, addr1);
  }

  swapf(index1, index2){
    var addr1 = this.regs.esp + index1 & MEM_MAX_ADDR;
    var addr2 = this.regs.esp + index2 & MEM_MAX_ADDR;

    var val1 = this.mem.readf(addr1);
    var val2 = this.mem.readf(addr2);

    this.mem.writef(val1, addr2);
    this.mem.writef(val2, addr1);
  }

  int(index){
    /*
      PSW bits:
        0 - I
        1 - T
        2 - L
    */

    if((this.regs.psw & 5) !== 1)
      return 0;

    var addrPtr = this.regs.ivtp + ((index & 255) << 2) & MEM_MAX_ADDR;
    var addr = this.mem.read(addrPtr) & MEM_MAX_ADDR;

    this.push(this.regs.psw & MEM_MAX_ADDR);
    this.push(this.regs.eip & MEM_MAX_ADDR);

    this.regs.psw &= 3;
    this.regs.psw |= 4;

    this.jump(addr);

    return 1;
  }

  intReq(index){
    if(this.intReqs.includes(index))
      return;

    this.intReqs.push(index);
  }

  rti(){
    this.regs.eip = this.pop() & MEM_MAX_ADDR;
    this.regs.psw = this.pop() & MEM_MAX_ADDR;
  }

  inte(){ this.regs.psw |= 1; }
  intd(){ this.regs.psw &= ~1; }
  trpe(){ this.regs.psw |= 2; }
  trpd(){ this.regs.psw &= ~2; }

  varGet(index){
    return this.mem.read(this.regs.ebp + index & MEM_MAX_ADDR) & MEM_MAX_ADDR;
  }

  varSet(val, index){
    return this.mem.write(val & MEM_MAX_ADDR, this.regs.ebp + index & MEM_MAX_ADDR);
  }

  varGetf(index){
    return this.mem.readf(this.regs.ebp + index & MEM_MAX_ADDR);
  }

  varSetf(val, index){
    return this.mem.writef(val, this.regs.ebp + index & MEM_MAX_ADDR);
  }

  debug(inst, str){
    log('');

    log(inst);
    log(str);

    var buff = Buffer.alloc(1);
    fs.readSync(process.stdin.fd, buff, 0, 1);
    if(buff.toString() !== '\r') process.exit(1);

    function log(a){
      fs.writeSync(process.stdout.fd, `${a}\n`);
    }
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

    return this.buff.readUInt32LE(addr);
  }

  write(val, addr){
    addr &= MEM_MAX_ADDR;
    if(addr > MEM_MAX_INT_ADDR)
      return;

    this.buff.writeUInt32LE(val & MEM_MAX_ADDR, addr);
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

function formatInt(a, unsigned = 0){
  if(a >= (MEM_MAX_ADDR >> 1)) return `${!unsigned ? '-' : ''}${-a & MEM_MAX_ADDR}`;
  return `${a}`;
}