'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Memory = require('./memory');
const BigInt = require('../bigint');

/**
 * This is how the implementation works:
 * Try to allocate the longest buffer possible whose length is power of 2. If either buffer size exceeds
 * MAX_BUF_SIZE or allocation was unsuccessfull, then split the existing buffer into CHUNKS_NUM smaller
 * buffers of equal size (CHUNKS_NUM must be power of 2). If the address that is being accessed is not
 * withing the buffer range, then save some of the smaller buffers to the disk and replace it with
 * required buffer (either allocate new buffer or load existing from disk). All addresses are represented
 * as BigInt instances.
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
    this.bufSize = new BigInt(8);

    // Auxiliary variables
    this.aux1 = new BigInt();
    this.aux2 = new BigInt();

    if(buf !== null)
      this.writeBuf(BigInt.zero(), buf);
  }

  read(addr){
    if(this.useMem) return this.mem.read(addr);
    if(addr.gte(this.bufSize)) return 0;

    const addrVal = addr.valueOf();
    const byteIndex = addrVal >> 3;
    const bitIndex = addrVal & 7;
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
    const byteIndex = addrVal >> 3;
    const bitIndex = addrVal & 7;
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
    const byteIndex = addrVal >> 3;
    const bitIndex = addrVal & 7;
    const mask = 1 << bitIndex;

    this.buf[byteIndex] ^= mask;
  }

  readInt(addr, num, size=null){
    const {aux1} = this;

    addr.copy(aux1);
    num.prepare();

    if(size === null){
      while(this.read(aux1)){
        num.push(this.read(aux1.inc()));
        aux1.inc();
      }
      num.push(1).dec();
    }else{
      if(size !== 0){
        while(1){
          num.push(this.read(aux1));
          if(--size === 0) break;
          aux1.inc();
        }
      }
    }

    return num;
  }

  writeInt(addr, num, size=null){
    const {aux1, aux2} = this;

    addr.copy(aux1);
    num.copy(aux2);

    if(size === null){
      aux2.inc();
      while(1){
        const bit = aux2.lowestBit();
        aux2.shr();
        if(aux2.isZero()) break;

        this.write(aux1, 1);
        this.write(aux1.inc(), bit);
        aux1.inc();
      }
      this.write(aux1, 0);
    }else{
      if(size !== 0){
        while(1){
          this.write(aux1, aux2.lowestBit());
          if(--size === 0) break;

          aux1.inc();
          aux2.shr();
        }
      }
    }
  }

  writeBuf(addr, buf){
    const {aux1} = this;
    const len = buf.length;

    addr.copy(aux1);

    for(let i = 0; i !== len; i++){
      const byte = buf[i];

      for(let j = 1; j !== 256; j <<= 1){
        this.write(aux1, byte & j ? 1 : 0);
        aux1.inc();
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
    if(this.useMem)
      this.mem.dispose();
  }
};

BitBuffer.Memory = Memory;

module.exports = BitBuffer;