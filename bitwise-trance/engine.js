'use strict';

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const O = require('../omikron');
const BitBuffer = require('./bit-buffer');

const {Address} = BitBuffer;

class Engine extends EventEmitter{
  constructor(src){
    super();

    this.mem = src;
    this.reader = new Reader(this.mem);
    this.addr = this.reader.addr;

    this.addr0 = new Address();
    this.addr1 = new Address();
    this.addr2 = new Address();

    this.ready = 1;
  }

  async tick(){
    if(!this.ready) throw new TypeError('Previous instruction has not finished yet');
    this.ready = 0;

    const {mem, reader, addr0, addr1, addr2} = this;

    reader.readAddr(addr0);
    const op1 = reader.readOpcode();
    reader.readAddr(addr1);
    const op2 = reader.readOpcode();
    reader.readAddr(addr2);

    const bit = mem.read(addr0);
    const op = bit ? op2 : op1;
    const addr = bit ? addr2 : addr1;
    const inst = [addr0, op1, addr1, op2, addr2];

    this.emit('beforeTick', inst, op, +addr);

    await this.execOp(op, addr);
    this.addr = this.reader.addr;

    this.ready = 1;
    this.emit('afterTick', inst, op, +addr);
  }

  async execOp(op, addr){
    const {mem, reader} = this;

    switch(op){
      case 0: // jmp
        reader.jump(addr);
        break;

      case 1: // xor
        mem.flip(addr);
        break;

      case 2: // in
        const bit = (await this.read()) & 1;
        mem.write(addr, bit);
        break;

      case 3: // out
        this.write(mem.read(addr));
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
};

class Reader{
  constructor(mem){
    this.mem = mem;
    this.ip = new Address();
  }

  jump(addr){
    this.ip = addr;
  }

  readBit(){
    const {ip} = this;
    const bit = this.mem.read(ip);
    ip.inc();
    return bit;
  }

  readOpcode(){
    return (this.readBit() << 1) | this.readBit();
  }

  readAddr(addr){
    addr.prepare();

    while(this.readBit())
      addr.push(this.readBit());

    return addr.push(1).dec();
  }
};

module.exports = Engine;