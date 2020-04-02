'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const videoSearchSim = require('.');

const main = () => {
  while(1){
    const len = O.rand(100);
    const arr = videoSearchSim.gen(len);
    const lenCalcd = videoSearchSim.calc(arr);
    if(lenCalcd === len) continue;

    const map = new Map();

    log(`Array: ${O.sfa(arr.map(a => {
      if(map.has(a)) return map.get(a);
      map.set(a, map.size);
      return map.size - 1;
    }))}\n`);

    log(`Expected: ${len}`);
    log(`Actual: ${lenCalcd}`);

    break;
  }
};

main();