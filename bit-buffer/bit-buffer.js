'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Memory = require('./memory');

/**
 * This is how the implementation works:
 * Try to allocate the longest buffer possible whose length is power of 2. If either buffer size exceeds
 * MAX_BUF_SIZE or allocation was unsuccessfull, then split the existing buffer into CHUNKS_NUM smaller
 * buffers of equal size (CHUNKS_NUM must be power of 2). If the address that is being accessed is not
 * withing the buffer range, then save some of the smaller buffers to the disk and replace it with
 * required buffer (either allocate new buffer or load existing from disk). All addresses are represented
 * as JavaScript BigInt primitives.
 */

const MAX_BUF_SIZE = 2 ** 16;
const CHUNKS_NUM = 8;

class BitBuffer{
  constructor(buf=null, maxBufSize=MAX_BUF_SIZE, chunksNum=CHUNKS_NUM){
    this.maxBufSize = maxBufSize;
    this.chunksNum = chunksNum;

    this.buf = Buffer.alloc(1);
    this.mem = null;
    this.useMem = 0;

    // Size of the buffer in bits
    this.bufSize = 8n;

    if(buf !== null)
      this.writeBuf(0n, buf);
  }

  read(addr){
    if(this.useMem) return this.mem.read(addr);
    if(addr >= this.bufSize) return 0;

    const addrVal = Number(addr);
    const byteIndex = addrVal >> 3;
    const bitIndex = addrVal & 7;
    const mask = 1 << bitIndex;

    return this.buf[byteIndex] & mask ? 1 : 0;
  }

  write(addr, bit){
    while(1){
      if(this.useMem) return this.mem.write(addr, bit);
      if(addr >= this.bufSize)
        if(bit) this.expand();
        else return;
      else break;
    }

    const addrVal = Number(addr);
    const byteIndex = addrVal >> 3;
    const bitIndex = addrVal & 7;
    const mask = 1 << bitIndex;

    if(bit) this.buf[byteIndex] |= mask;
    else this.buf[byteIndex] &= ~mask;
  }

  flip(addr){
    while(1){
      if(this.useMem) return this.mem.flip(addr, bit);
      if(addr >= this.bufSize) this.expand();
      else break;
    }

    const addrVal = Number(addr);
    const byteIndex = addrVal >> 3;
    const bitIndex = addrVal & 7;
    const mask = 1 << bitIndex;

    this.buf[byteIndex] ^= mask;
  }

  readInt(addr, size=null){
    let num = 0n;
    let mask = 1n;

    if(size === null){
      while(this.read(addr++)){
        if(this.read(addr++)) num |= mask;
        mask <<= 1n;
      }
      num = (num | mask) - 1n;
    }else{
      while(size--){
        if(this.read(addr++)) num |= mask;
        mask <<= 1n;
      }
    }

    return num;
  }

  writeInt(addr, num, size=null){
    if(size === null){
      num++;
      while(1){
        const bit = num & 1n ? 1 : 0;
        num >>= 1n;
        if(!num) break;
        this.write(addr++, 1);
        this.write(addr++, bit);
      }
      this.write(addr, 0);
    }else{
      while(size--){
        this.write(addr++, num & 1n ? 1 : 0);
        num >>= 1n;
      }
    }
  }

  writeBuf(addr, buf){
    const len = buf.length;

    for(let i = 0; i !== len; i++){
      const byte = buf[i];
      for(let j = 1; j !== 256; j <<= 1)
        this.write(addr++, byte & j ? 1 : 0);
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
      this.bufSize <<= 1n;
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
    if(this.useMem)
      this.mem.dispose();
  }
}

BitBuffer.Memory = Memory;

module.exports = BitBuffer;