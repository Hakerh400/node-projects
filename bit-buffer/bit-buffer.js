'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Memory = require('./memory');
const Address = require('./address');

/**
 * This is how the implementation works:
 * Try to allocate the longest buffer possible whose length is power of 2. If either buffer size exceeds
 * MAX_BUF_SIZE or allocation was unsuccessfull, then split the existing buffer into CHUNKS_NUM smaller
 * buffers of equal size (CHUNKS_NUM must be power of 2). If the address that is being accessed is not
 * withing the buffer range, then save some of the smaller buffers to the disk and replace it with
 * required buffer (either allocate new buffer or load existing from disk). All addresses are represented
 * as BigInt primitives.
 */

const MAX_BUF_SIZE = 2 ** 30;
const CHUNKS_NUM = 8;

class BitBuffer{
  constructor(buf=null, maxBufSize=MAX_BUF_SIZE, chunksNum=CHUNKS_NUM){
    this.maxBufSize = maxBufSize;
    this.chunksNum = chunksNum;

    this.buf = Buffer.alloc(1);
    this.mem = null;
    this.useMem = 0;

    // Size of the buffer in bits
    this.bufSize = new Address(8);

    if(buf !== null)
      this.writeBuf(Address.zero(), buf);
  }

  read(addr){
    if(this.useMem) return this.mem.read(addr);
    if(addr.gte(this.bufSize)) return 0;

    const addrVal = addr.valueOf();
    const byteIndex = addrVal >> 8;
    const bitIndex = addrVal & 255;
    const mask = 1 << bitIndex;

    return this.buf[byteIndex] & mask ? 1 : 0;
  }

  write(addr, bit){
    while(1){
      if(this.useMem) return this.mem.write(addr, bit);
      if(addr.gte(this.bufSize))
        if(bit) this.expand();
        else return;
      else break;
    }

    const addrVal = addr.valueOf();
    const byteIndex = addrVal >> 8;
    const bitIndex = addrVal & 255;
    const mask = 1 << bitIndex;

    if(bit) this.buf[byteIndex] |= mask;
    else this.buf[byteIndex] &= ~mask;
  }

  flip(addr){
    while(1){
      if(this.useMem) return this.mem.flip(addr, bit);
      if(addr.gte(this.bufSize)) this.expand();
      else break;
    }

    const addrVal = addr.valueOf();
    const byteIndex = addrVal >> 8;
    const bitIndex = addrVal & 255;
    const mask = 1 << bitIndex;

    this.buf[byteIndex] ^= mask;
  }

  writeBuf(addr, buf){
    const {addr1} = this;
    const len = buf.length;

    index.copy(addr1);

    for(let i = 0; i !== len; i++){
      for(let j = 1; j !== 256; j <<= 1){
        this.write(addr1, byte & j ? 1 : 0);
        addr1.inc();
      }
    }
  }

  expand(){
    if(this.useMem)
      throw new TypeError('Cannot expand while using memory');

    const {buf} = this;
    const len = buf.length;

    if(len === this.maxBufSize){
      this.switchToMem();
      return;
    }

    try{
      this.buf = Buffer.alloc(len << 1);
      buf.copy(this.buf);
      this.bufSize.shl();
    }catch(err){
      this.switchToMem();
    }
  }

  switchToMem(){
    this.mem = new Memory(this.buf, this.chunksNum);

    this.buf = null;
    this.bufSize = null;

    this.useMem = 1;
  }

  dispose(){
    if(!this.useMem) return;
    this.mem.dispose();
  }
};

BitBuffer.Memory = Memory;
BitBuffer.Address = Address;

module.exports = BitBuffer;