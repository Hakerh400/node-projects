'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const BitBuffer = require('../bit-buffer');
const BigInt = require('../bigint');
const Table = require('../table');

const bi4 = new BigInt(4);

class Engine{
  constructor(src, input){
    this.mem = new BitBuffer(src);
  }

  run(){
    const {mem} =  this;

    const ops = [
      /* 0 */ ['CONST', () => {
        O.noimpl('CONST');
      }],
      /* 1 */ ['JZ', () => {
        O.noimpl('JZ');
      }],
      /* 2 */ ['CALL', () => {
        O.noimpl('CALL');
      }],
      /* 3 */ ['RET', () => {
        O.noimpl('RET');
      }],
      /* 4 */ ['PUSH', () => {
        O.noimpl('PUSH');
      }],
      /* 5 */ ['POP', () => {
        O.noimpl('POP');
      }],
      /* 6 */ ['GET', () => {
        O.noimpl('GET');
      }],
      /* 7 */ ['SET', () => {
        O.noimpl('SET');
      }],
      /* 8 */ ['READ', () => {
        O.noimpl('READ');
      }],
      /* 9 */ ['WRITE', () => {
        O.noimpl('WRITE');
      }],
      /* A */ ['NEG', () => {
        O.noimpl('NEG');
      }],
      /* B */ ['IMP', () => {
        argsNum = 2;
        hasRes = 1;

        mem.readInt(addr.from(sp).inc().lbs(s).mul(size), num1, size);
        mem.readInt(addr.from(sp).mul(size), num2, size);

        res.from(num1).imp(num2).lbs(s);

        mem.writeInt(addr.from(ptr).mul(size), num3.from(ip).inc(), size);
        mem.writeInt(addr.from(ptr).inc().lbs(s).mul(size), num3.from(sp).inc(), size);
        mem.writeInt(addr.from(sp).inc().lbs(s).mul(size), res, size);
      }],
      /* C */ ['SHL', () => {
        argsNum = 2;
        hasRes = 1;

        mem.readInt(addr.from(sp).inc().lbs(s).mul(size), num1, size);
        mem.readInt(addr.from(sp).mul(size), num2, size);

        res.from(num1);
        if(num3.from(num2).isPos()) res.shl(+num3)
        else res.shr(+num3.minus());
        res.lbs(s);

        mem.writeInt(addr.from(ptr).mul(size), num3.from(ip).inc(), size);
        mem.writeInt(addr.from(ptr).inc().lbs(s).mul(size), num3.from(sp).inc(), size);
        mem.writeInt(addr.from(sp).inc().lbs(s).mul(size), res, size);
      }],
      /* D */ ['ADD', () => {
        O.noimpl('ADD');
      }],
      /* E */ ['IN', () => {
        O.noimpl('IN');
      }],
      /* F */ ['OUT', () => {
        O.noimpl('OUT');
      }],
    ];

    const columns = ['#', 'Size', 'PTR', 'IP', 'SP', 'Instruction', 'Arguments', 'Result', 'I/O'];
    const table = new Table(columns);

    const size = new BigInt();
    const ptr = new BigInt();
    const ip = new BigInt();
    const sp = new BigInt();
    const opc = new BigInt();

    const addr = new BigInt();
    const num1 = new BigInt();
    const num2 = new BigInt();
    const num3 = new BigInt();
    const res = new BigInt();

    const args = [num1, num2];

    let argsNum = 0;
    let hasRes = 0;
    let hasIO = 0;

    let s;

    let i = 0;
    while(i++ !== 5){
      argsNum = 0;
      hasRes = 0;
      hasIO = 0;

      log(mem.buf.toString('hex'));

      mem.readInt(addr.set(0), size);
      size.add(bi4);
      s = +size;

      mem.readInt(size, ptr, size);
      mem.readInt(addr.from(ptr).mul(size), ip, size);
      mem.readInt(addr.from(ptr).inc().lbs(s).mul(size), sp, size);
      mem.readInt(addr.from(ip).mul(size), opc, size);

      const op = ops[+opc.lbs(4)];
      op[1]();

      const argsStr = args.slice(0, argsNum).map(arg => arg.toString()).join(', ');
      const resStr = hasRes ? res : '/';
      const ioStr = hasIO ? 'IO' : '/';

      table.addRow([i, size, ptr, ip, sp, op[0], argsStr, resStr, ioStr]);
    }

    return table.toString();
  }

  dispose(){
    this.mem.dispose();
  }
};

module.exports = Engine;