'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const arrOrder = require('../arr-order');
const videoSearchSim = require('.');

const chars = O.chars('A', 26);

const main = () => {
  while(1){
    const len = O.rand(10);
    const arr = videoSearchSim.gen(len);
    const lenCalcd = videoSearchSim.calc(arr);
    // if(lenCalcd === len) continue;

    const map = new Map();

    log(`Input: <code>${arr.map(a => {
      if(map.has(a)) return map.get(a);
      map.set(a, arrOrder.str(chars, map.size + 1));
      return arrOrder.str(chars, map.size);
    }).join(' ')}</code><br/>`);

    // log(`Expected: ${len}`);
    log(`Output: <code>${lenCalcd}</code>`);

    break;
  }
};

main();