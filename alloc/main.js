'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const format = require('../format');
const Memory = require('./memory');

const r = O.rand;
const ri = O.randInt;

const main = () => {
  const mem = new Memory();
  const blocks = [];

  const alloc = () => {
    const size = ri(1);
    blocks.push([mem.alloc(size), size]);
  };

  const free = () => {
    const [ptr, size] = O.randElem(blocks, 1);
    mem.free(ptr);
  };

  const write = () => {
    const [ptr, size] = O.randElem(blocks);
    mem.set(ptr + r(size), ri() * (r() * 2 - 1));
  };

  let i = 0;

  while(1){
    if(++i === 1e6){
      i = 0;
      
      log(format.num(mem.max));
      log(format.num(blocks.length));
      log();
    }

    if(blocks.length === 0){
      alloc();
      continue;
    }

    switch(r(3)){
      case 0: alloc(); break;
      case 1: free(); break;
      case 2: write(); break;
    }
  }
};

main();