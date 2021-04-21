'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const OPS_NUM = 11;

const cwd = __dirname;
const testDir = path.join(cwd, 'test');
const srcFile = path.join(testDir, 'src.txt');

/*
  0  - push 0
  1  - push 1
  2  - flip
  3  - dupe
  4  - swap
  5  - pop
  6  - test
  7  - jmp
  8  - neof
  9  - in
  10 - out
*/

const opCodes = {
  '0': 0,
  '1': 1,
  'flip': 2,
  'dupe': 3,
  'swap': 4,
  'pop': 5,
  'test': 6,
  'neof': 8,
  'in': 9,
  'out': 10,
};

const main = () => {
  O.bion(1);

  let ser = new O.NatSerializer();

  const toks = O.match(O.rfs(srcFile, 1), /\S+/g);
  const insts = [];
  const labs = O.obj();
  let lastLabIndex = 0;

  for(const tok of toks){
    if(O.has(opCodes, tok)){
      insts.push(opCodes[tok]);
      continue;
    }

    if(tok.startsWith(':')){
      insts.push([tok.slice(1)]);
      continue;
    }

    assert(tok.endsWith(':'));

    const lab = tok.slice(0, -1);
    assert(!O.has(labs, lab));

    const index = insts.length;
    labs[lab] = index;
    lastLabIndex = index;
  }

  for(const inst of insts){
    if(!O.isArr(inst)) continue;

    const lab = inst[0];
    assert(O.has(labs, lab));

    inst[0] = labs[lab];
  }

  const labMod = lastLabIndex + 1;
  const labModBits = O.rev(labMod.toString(2).slice(1));

  for(const bit of labModBits){
    ser.write(2, 1);
    ser.write(2, bit);
  }

  ser.write(2, 0);

  for(let i = 0; i !== insts.length; i++){
    const inst = insts[i];

    if(i >= lastLabIndex) ser.inc();

    if(!O.isArr(inst)){
      ser.write(OPS_NUM, inst);
      continue;
    }

    ser.write(OPS_NUM, 7);
    ser.write(labMod, inst[0]);
  }

  ser = new O.NatSerializer(ser.output);

  const bytes = [];

  while(ser.nz)
    bytes.push(0x21 + Number(ser.read(94)));

  log(Buffer.from(bytes).toString());
};

main();