'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const main = () => {
  const a = O.bisect(i => {
    try{
      2n << i;
      return 0;
    }catch{
      return 1;
    }
  });

  const n = 1n << a;

  const b = O.bisect(i => {
    try{
      n + i;
      return 0;
    }catch{
      return 1;
    }
  }) - 1n;

  log(`Max bigint value: 2 ^ ${a}${b !== 0n ? ` + ${b}` : ''}`);
};

main();