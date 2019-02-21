'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const BitBuffer = require('../bit-buffer');
const Table = require('../table');

const TABLE = 0;

class Engine{
  constructor(src, input){
    this.mem = new BitBuffer(src);
    this.io = new O.IO(input, 0, 1);
  }

  run(){
    const {mem, io} =  this;

    const ops = [
      ['const', 0, 1, () => {
        res = read(ip1++);
      }],
      ['jz', 2, 0, () => {
        if(!num1) ip1 = num2;
      }],
      ['call', 1, 1, () => {
        res = ip1;
        ip1 = num1;
      }],
      ['ret', 1, 0, () => {
        ip1 = num1;
      }],
      ['push', 0, 1, () => {
        res = read(sp);
      }],
      ['pop', 1, 0, () => {
      }],
      ['get', 1, 1, () => {
        res = read(sp + num1);
      }],
      ['set', 2, 0, () => {
        wrAddr = sp + num2;
        wrVal = num1;
      }],
      ['read', 1, 1, () => {
        res = read(num1);
      }],
      ['write', 2, 0, () => {
        wrAddr = num2;
        wrVal = num1;
      }],
      ['neg', 1, 1, () => {
        res = num1 ^ mask;
      }],
      ['imp', 2, 1, () => {
        res = (num1 ^ mask) | num2;
      }],
      ['shl', 2, 1, () => {
        if(num2 & upBit) res = num1 >> (num2 ^ mask) + 1n;
        else res = num1 << num2;
      }],
      ['add', 2, 1, () => {
        res = num1 + num2;
      }],
      ['in', 0, 1, () => {
        inb = io.read();
        res = BigInt(inb);
      }],
      ['out', 1, 0, () => {
        outb = Number(num1 & 1n);
      }],
    ];

    const read = addr => {
      return mem.readInt((addr & mask) * size, size);
    };

    const write = (addr, num) => {
      mem.writeInt((addr & mask) * size, num & mask, size);
    };

    let columns, table;
    if(TABLE){
      columns = ['#', 'Size', 'PTR', 'IP', 'SP', 'Instruction', 'Arguments', 'Result', 'Stack', 'I/O'];
      table = new Table(columns);
    }

    let size = 0n;
    let mask = 0n;
    let upBit = 0n;

    let ptr = 0n;
    let ip = 0n;
    let sp = 0n;
    let opc = 0n;

    let addr = 0n;
    let num1 = 0n;
    let num2 = 0n;
    let res = 0n;

    let ip1 = 0n;
    let wrAddr = 0n;
    let wrVal = null;

    let inb = null;
    let outb = null;
    let odd = 0;

    let i = 0;

    while(1){
      i++;

      size = mem.readInt(0n) + 4n;
      mask = (1n << size) - 1n;
      upBit = 1n << size - 1n;

      ptr = read(1n);
      ip = read(ptr);
      sp = read(ptr + 1n);
      opc = Number(read(ip) & 15n);

      const [name, argsNum, hasRes, func] = ops[opc];

      let argsStr;
      {
        if(argsNum === 1){
          num1 = read(sp);
          argsStr = `${num1}`;
        }else if(argsNum === 2){
          num1 = read(sp + 1n);
          num2 = read(sp);
          argsStr = `(${num1}, ${num2})`;
        }else{
          argsStr = '/';
        }
      }

      ip1 = ip + 1n;
      wrVal = null;
      inb = null;
      outb = null;

      func();

      {
        write(ptr, ip1);

        const dif = BigInt(argsNum - hasRes);
        const sp1 = sp + dif;

        if(dif) write(ptr + 1n, sp1);
        if(hasRes) write(sp1, res);
      }

      if(wrVal !== null) write(wrAddr, wrVal);

      if(TABLE){
        const resStr = hasRes ? res : '/';
        const ioStr = inb !== null ? `IN ${inb}` : outb !== null ? `OUT ${outb}` : '/';

        const stack = [];
        {
          let s = sp + BigInt(argsNum - hasRes) & mask;
          while(s !== mask){
            stack.push(read(s));
            s++;
          }
        }
        const stackStr = `[${stack.join(', ')}]`;

        table.addRow([i, size, ptr, ip, sp, name.toUpperCase(), argsStr, resStr, stackStr, ioStr]);
      }

      if(outb !== null){
        if(!odd){ if(!outb) break; }
        else io.write(outb);
        odd ^= 1;
      }
    }

    let outStr = io.getOutput();
    if(TABLE) outStr = `${table.toString()}\n\n${outStr}`;

    return outStr;
  }

  dispose(){
    this.mem.dispose();
  }
};

module.exports = Engine;