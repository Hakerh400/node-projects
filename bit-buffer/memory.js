'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const O = require('../omikron');
const Address = require('./address');

const tempDir = os.tmpdir();

class Memory{
  constructor(buf, chunksNum){
    this.active = 1;

    this.buf = buf;
    this.chunksNum = chunksNum;

    this.bufLen = buf.length; // In bytes
    this.chunkSize = this.bufLen / chunksNum | 0; // In bytes
    this.shiftNum = Math.log2(this.chunkSize) + 3 | 0; // In bits

    // Used as auxiliary address
    this.aux = new Address();

    // Initialize RAM chunks
    {
      const size = this.chunkSize;
      const slices = [];

      const ramMap = new AddrMap();
      const ramArr = [];
      const refArr1 = [];
      const refArr2 = [];

      for(let i = 0; i !== chunksNum; i++){
        const offset = size * i;
        const saddr = new Address(i);

        ramMap.set(saddr, i);
        ramArr.push(saddr.clone());

        slices.push(buf.slice(offset, offset + size));
        refArr1.push(i);
        refArr2.push(i);
      }

      this.slices = slices;
      this.ramMap = ramMap;
      this.ramArr = ramArr;
      this.refArr1 = refArr1;
      this.refArr2 = refArr2;
    }

    this.diskMap = new AddrMap();
    this.diskArr = [];

    // Create temp directory
    {
      const nums = O.sortAsc(
        fs.readdirSync(tempDir)
          .filter(name => /^\d{1,9}$/.test(name))
          .map(name => name | 0)
      );

      let index = nums.findIndex((n, i) => n !== i);
      if(index === -1) index = nums.length;

      const dirName = String(index);
      const dir = path.join(tempDir, dirName);

      fs.mkdirSync(dir);

      this.dir = dir;
      this.file = path.join(dir, 'temp');
    }

    // Used for memory operations
    this.sliceIndex = null;
    this.slice = null;
    this.byteIndex = null;
    this.bitIndex = null;
    this.mask = null;
  }

  getChunk(saddr){
    const {ramMap, ramArr, diskMap, diskArr, refArr1, refArr2} = this;
    
    saddr.normalize();

    if(!ramMap.has(saddr)){
      const i = O.last(refArr2);
      const slice = this.slices[i];

      if(diskMap.has(saddr)){
        const di = diskMap.get(saddr);
        const file = path.join(this.dir, String(di));

        fs.writeFileSync(this.file, slice);

        const fd = fs.openSync(file, 'r');
        fs.readSync(fd, slice, 0, this.chunkSize, 0);
        fs.closeSync(fd);

        fs.unlinkSync(file);
        fs.renameSync(this.file, file);

        const saddr1 = ramArr[i];
        ramArr[i] = saddr;
        diskArr[di] = saddr1;

        ramMap.remove(saddr1);
        ramMap.set(saddr, i);
        diskMap.remove(saddr);
        diskMap.set(saddr1, di);

        diskMap.has(saddr1);
      }else{
        const di = diskArr.length;
        const file = path.join(this.dir, String(di));

        fs.writeFileSync(file, slice);
        slice.fill(0);

        const saddr1 = ramArr[i];
        ramArr[i] = saddr;
        diskArr.push(saddr1);

        ramMap.remove(saddr1);
        ramMap.set(saddr, i);
        diskMap.set(saddr1, di);
      }
    }

    const i = ramMap.get(saddr);
    this.sliceIndex = i;

    const j = refArr1[i];
    if(j === 0) return;

    const x = refArr2[j];
    const y = refArr2[j - 1];

    refArr2[j - 1] = x;
    refArr2[j] = y;
    refArr1[x]--;
    refArr1[y]++;
  }

  fetch(addr){
    const saddr = addr.copy(this.aux).shr(this.shiftNum);
    this.getChunk(saddr);

    const index = +addr.copy(this.aux).lowestBits(this.shiftNum);
    this.slice = this.slices[this.sliceIndex];
    this.byteIndex = index >>> 3;
    this.bitIndex = index & 7;
    this.mask = 1 << this.bitIndex;
  }

  read(addr){
    this.fetch(addr);
    return this.slice[this.byteIndex] & this.mask ? 1 : 0;
  }

  write(addr, bit){
    this.fetch(addr);
    if(bit) this.slice[this.byteIndex] |= this.mask;
    else this.slice[this.byteIndex] &= ~this.mask;
  }

  flip(addr){
    this.fetch(addr);
    this.slice[this.byteIndex] ^= this.mask;
  }

  dispose(){
    const {dir} = this;
    const len = this.diskArr.length;

    try{
      for(let i = 0; i !== len; i++){
        const file = path.join(dir, String(i));
        fs.unlinkSync(file);
      }

      fs.rmdirSync(dir);
    }catch{}

    this.active = 0;
  }
};

class AddrMap{
  constructor(){
    this.map = new O.MultidimensionalMap();
  }

  has(addr){ return this.map.has(addr.arr); }
  get(addr){ return this.map.get(addr.arr); }
  set(addr, val){ return this.map.set(addr.arr, val); }
  remove(addr){ return this.map.remove(addr.arr); }
  delete(addr){ return this.map.delete(addr.arr); }
};

module.exports = Memory;