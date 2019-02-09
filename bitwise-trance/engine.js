'use strict';

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const O = require('../omikron');
const BitBuffer = require('./bit-buffer');

class Engine extends EventEmitter{
  constructor(src){
    super();

    this.mem = new BitBuffer(src);
    this.reader = new Reader(this.mem);
    this.addr = this.reader.addr;
  }

  async tick(){
    const {mem, reader} = this;

    const addr0 = reader.readAddr();
    const op1 = reader.readOpcode();
    const addr1 = reader.readAddr();
    const op2 = reader.readOpcode();
    const addr2 = reader.readAddr();

    const bit = mem.get(addr0);
    const op = bit ? op2 : op1;
    const addr = bit ? addr2 : addr1;

    this.emit('beforeTick', op, addr);

    await this.execOp(op, addr);
    this.addr = this.reader.addr;

    this.emit('afterTick', op, addr);
  }

  async execOp(op, addr){
    const {mem, reader} = this;

    switch(op){
      case 0: // jump
        reader.jump(addr);
        break;

      case 1: // xor
        mem.xor(addr);
        break;

      case 2: // read
        const bit = (await this.read()) & 1;
        mem.set(addr, bit);
        break;

      case 3: // write
        this.write(mem.get(addr));
        break;
    }
  }

  read(){
    return new Promise(res => {
      this.emit('read', res);
    });
  }

  write(bit){
    this.emit('write', bit);
  }

  toString(){
    const {addr} = this;
    let str = this.mem.toString();

    str = `${str.slice(0, addr)}.${str.slice(addr)}`;

    return str;
  }
};

class Reader{
  constructor(mem, addr=0){
    this.mem = mem;
    this.addr = addr;
  }

  jump(addr){
    this.addr = addr;
  }

  readBit(){
    return this.mem.get(this.addr++);
  }

  readOpcode(){
    return (this.readBit() << 1) | this.readBit();
  }

  readAddr(){
    let num = 0;
    let mask = 1;
    let len = 0;

    while(this.readBit()){
      if(++len === 30)
        throw new RangeError('Too large address');
      if(this.readBit())
        num |= mask;
      mask <<= 1;
    }

    return (num | mask) - 1;
  }
};

module.exports = Engine;